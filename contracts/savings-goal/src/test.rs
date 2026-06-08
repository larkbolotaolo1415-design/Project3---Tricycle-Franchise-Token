#![cfg(test)]
use super::*;
use soroban_sdk::{Address, Env};

fn setup(env: &Env) -> FranchiseRightsContractClient<'_> {
    let contract_id = env.register(FranchiseRightsContract, ());
    FranchiseRightsContractClient::new(env, &contract_id)
}

#[test]
fn init_sets_admin() {
    let env = Env::default();
    let client = setup(&env);
    let admin = Address::from_str(&env, "GAE4VO4ONF7CRWX573MI4MFC642E5XJ3EZ6KKWCACRPMHMLMDDDGLIKD");

    client.init(&admin);
    assert_eq!(client.get_admin(), admin);
}

#[test]
fn admin_can_issue_and_query_franchise() {
    let env = Env::default();
    let client = setup(&env);
    let admin = Address::from_str(&env, "GAE4VO4ONF7CRWX573MI4MFC642E5XJ3EZ6KKWCACRPMHMLMDDDGLIKD");
    let owner = Address::from_str(&env, "GAOAXGEER7PZ7WU5GY2NT3VVKDTUOEXCBAVU4ZM25RF3WX4GQIRHUWMZ");

    client.init(&admin);
    env.mock_all_auths();
    client.issue_franchise(&"Route-001".into(), &owner);

    let info = client.get_franchise(&"Route-001".into()).unwrap();
    assert_eq!(info.owner, owner);
    assert!(info.pending.is_none());
}

#[test]
fn owner_can_request_transfer_and_admin_can_approve() {
    let env = Env::default();
    let client = setup(&env);
    let admin = Address::from_str(&env, "GAE4VO4ONF7CRWX573MI4MFC642E5XJ3EZ6KKWCACRPMHMLMDDDGLIKD");
    let owner = Address::from_str(&env, "GAOAXGEER7PZ7WU5GY2NT3VVKDTUOEXCBAVU4ZM25RF3WX4GQIRHUWMZ");
    let next_owner = Address::from_str(&env, "GB7DFFG7HUT6LJHWPLTSEMR7A6KQX66MOR4VRYVT4JQVHQAA6WHN6XMM");

    client.init(&admin);
    env.mock_all_auths();
    client.issue_franchise(&"Route-002".into(), &owner);
    client.request_transfer(&"Route-002".into(), &next_owner);
    client.approve_transfer(&"Route-002".into());

    let info = client.get_franchise(&"Route-002".into()).unwrap();
    assert_eq!(info.owner, next_owner);
    assert!(info.pending.is_none());
}

#[test]
fn unauthorized_requests_fail() {
    let env = Env::default();
    let client = setup(&env);
    let admin = Address::from_str(&env, "GAE4VO4ONF7CRWX573MI4MFC642E5XJ3EZ6KKWCACRPMHMLMDDDGLIKD");
    let owner = Address::from_str(&env, "GAOAXGEER7PZ7WU5GY2NT3VVKDTUOEXCBAVU4ZM25RF3WX4GQIRHUWMZ");
    let stranger = Address::from_str(&env, "GB7DFFG7HUT6LJHWPLTSEMR7A6KQX66MOR4VRYVT4JQVHQAA6WHN6XMM");

    client.init(&admin);
    env.mock_all_auths();
    client.issue_franchise(&"Route-003".into(), &owner);
    env.set_auths(&[]);

    assert!(matches!(client.try_request_transfer(&"Route-003".into(), &stranger), Err(Err(_))));
}
