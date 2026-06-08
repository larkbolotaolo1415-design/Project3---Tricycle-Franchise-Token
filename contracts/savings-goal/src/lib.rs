#![no_std]
//! Tricycle Franchise Rights — a Soroban contract that records route rights,
//! preserves ownership, and requires the LGU to approve all transfers.

extern crate alloc;
use alloc::string::String;
use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Bytes, Env};

#[contracttype]
#[derive(Clone)]
pub struct FranchiseInfo {
    pub owner: Address,
    pub pending: Option<Address>,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Franchise(Bytes),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    FranchiseExists = 4,
    FranchiseNotFound = 5,
    NoPendingTransfer = 6,
    InvalidRouteId = 7,
    InvalidOwner = 8,
}

#[contract]
pub struct FranchiseRightsContract;

#[contractimpl]
impl FranchiseRightsContract {
    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        let storage = env.storage().instance();
        if storage.has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        storage.set(&DataKey::Admin, &admin);
        Ok(())
    }

    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    pub fn issue_franchise(
        env: Env,
        route_id: String,
        owner: Address,
    ) -> Result<(), Error> {
        let storage = env.storage().instance();
        Self::require_admin(&env)?;
        if route_id.is_empty() {
            return Err(Error::InvalidRouteId);
        }
        let route_key = Bytes::from_slice(&env, route_id.as_bytes());
        if storage.has(&DataKey::Franchise(route_key.clone())) {
            return Err(Error::FranchiseExists);
        }
        storage.set(
            &DataKey::Franchise(route_key),
            &FranchiseInfo { owner, pending: None },
        );
        Ok(())
    }

    pub fn request_transfer(
        env: Env,
        route_id: String,
        to: Address,
    ) -> Result<(), Error> {
        let storage = env.storage().instance();
        let route_key = Bytes::from_slice(&env, route_id.as_bytes());
        let mut info: FranchiseInfo = storage
            .get(&DataKey::Franchise(route_key.clone()))
            .ok_or(Error::FranchiseNotFound)?;
        info.owner.require_auth();
        if info.owner == to {
            return Err(Error::InvalidOwner);
        }
        if info.pending.is_some() {
            return Err(Error::NoPendingTransfer);
        }
        info.pending = Some(to);
        storage.set(&DataKey::Franchise(route_key), &info);
        Ok(())
    }

    pub fn approve_transfer(env: Env, route_id: String) -> Result<(), Error> {
        let storage = env.storage().instance();
        Self::require_admin(&env)?;
        let route_key = Bytes::from_slice(&env, route_id.as_bytes());
        let mut info: FranchiseInfo = storage
            .get(&DataKey::Franchise(route_key.clone()))
            .ok_or(Error::FranchiseNotFound)?;
        let pending = info.pending.ok_or(Error::NoPendingTransfer)?;
        info.owner = pending;
        info.pending = None;
        storage.set(&DataKey::Franchise(route_key), &info);
        Ok(())
    }

    pub fn get_franchise(env: Env, route_id: String) -> Option<FranchiseInfo> {
        let route_key = Bytes::from_slice(&env, route_id.as_bytes());
        env.storage().instance().get(&DataKey::Franchise(route_key))
    }

    fn require_admin(env: &Env) -> Result<(), Error> {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).ok_or(Error::NotInitialized)?;
        admin.require_auth();
        Ok(())
    }
}

mod test;
