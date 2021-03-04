use ink_env::AccountId;
use ink_prelude::string::String;

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
pub enum Vote {
    None,
    Yes,
    No,
}

/// Defines Proposal.
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
pub struct Proposal {
    /// the applicant who wishes to become a member - this key will be used for withdrawals (doubles as guild kick target for gkick proposals)
    applicant: AccountId,
    /// the account that submitted the proposal (can be non-member)
    proposer: AccountId,
    /// the member that sponsored the proposal (moving it into the queue)
    sponsor: AccountId,
    /// the # of shares the applicant is requesting
    share_requested: u128,
    /// the amount of loot the applicant is requesting
    loot_requested: u128,
    /// amount of tokens offered as tribute
    tributed_offered: u128,
    /// tribute token contract reference
    tributed_token: u128,
    /// amount of tokens requested as payment
    payment_requested: u128,
    /// payment token contract reference
    payment_token: u128,
    /// the period in which voting can start for this proposal
    starting_period: u128,
    /// the total number of YES votes for this proposal
    yes_votes: u128,
    /// the total number of NO votes for this proposal
    no_votes: u128,
    /// [sponsored, processed, didPass, cancelled, whitelist, guildkick]
    flags: [bool; 6],
    /// proposal details - could be IPFS hash, plaintext, or JSON
    details: String,
    /// the maximum # of total shares encountered at a yes vote on this proposal
    max_total_shares_and_loot_at_yes_vote: u128,
    /// the votes on this proposal by each member
    //        votes_by_member: ink_storage::collections::HashMap<AccountId, Balance>,
    votes_by_member: u128,
}

pub type ProposalId = u128;
pub type ProposalIndex = u128;
pub type Proposals = ink_storage::collections::Vec<Proposal>;
