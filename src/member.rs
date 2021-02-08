use ink_env::AccountId;
use crate::proposal::{ProposalId};

/// Defines Member.
#[derive(
    Debug,
    PartialEq,
    Eq,
    scale::Encode,
    scale::Decode,
    ink_storage::traits::SpreadLayout,
    ink_storage::traits::PackedLayout,
)]
#[cfg_attr(
    feature = "std",
    derive(scale_info::TypeInfo, ink_storage::traits::StorageLayout)
)]
pub struct Member {
    /// the key responsible for submitting proposals and voting - defaults to member address unless updated
    pub delegate_key: AccountId,
    /// the # of voting shares assigned to this member
    pub shares: u128,
    /// the loot amount available to this member (combined with shares on ragequit)
    pub loot: u128,
    /// always true once a member has been created
    pub exists: bool,
    // highest proposal index # on which the member voted YES
    pub highest_index_yes_vote: u128,
    // set to proposalIndex of a passing guild kick proposal for this member, prevents voting on and sponsoring proposals
    pub jailed: ProposalId,
}

impl Member {
    pub fn new(_delegate_key: AccountId) -> Self {
        Self {
            delegate_key: _delegate_key,
            shares: 1,
            loot: 0,
            exists: true,
            highest_index_yes_vote: 0,
            jailed: 0,
        }
    }
}

pub type Members = ink_storage::collections::Vec<Member>;