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
    Copy,
    Clone,
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
    pub applicant: Option<AccountId>,
    /// the account that submitted the proposal (can be non-member)
    pub proposer: AccountId,
    /// the member that sponsored the proposal (moving it into the queue)
    pub sponsor: Option<AccountId>,
    /// the # of shares the applicant is requesting
    pub shares_requested: u128,
    /// the amount of loot the applicant is requesting
    pub loot_requested: u128,
    /// amount of tokens offered as tribute
    pub tribute_offered: Option<u128>,
    /// tribute token contract reference
    pub tribute_token: Option<AccountId>,
    /// amount of tokens requested as payment
    pub payment_requested: Option<u128>,
    /// payment token contract reference
    pub payment_token: Option<AccountId>,
    /// the period in which voting can start for this proposal
    pub starting_period: u128,
    /// the total number of YES votes for this proposal
    pub yes_votes: u128,
    /// the total number of NO votes for this proposal
    pub no_votes: u128,
    /// [sponsored, processed, didPass, cancelled, whitelist, guildkick]
    pub flags: [bool; 6],
    /// proposal details - could be IPFS hash, plaintext, or JSON
    pub details: [u8; 32],
    /// the maximum # of total shares encountered at a yes vote on this proposal
    pub max_total_shares_and_loot_at_yes_vote: u128,
    // the votes on this proposal by each member
    // @FIXME: this does not work.
    //pub votes_by_member: StorageHashMap<AccountId, Vote>
}

impl Proposal {
    pub fn new(
        applicant: Option<AccountId>,
        proposor: AccountId,
        sponsor: Option<AccountId>,
        shares_requested: u128,
        loot_requested: u128,
        tribute_offered: Option<u128>,
        tribute_token: Option<AccountId>,
        payment_requested: Option<u128>,
        payment_token: Option<AccountId>,
        details: String,
        flags: [bool; 6],
    ) -> Self {
        // encodes details to an array of butes, so we could storage it on chain.
//        let mut details_bytes: [u8; 32] = Default::default();
 //       details_bytes.copy_from_slice(details.as_bytes());

        Self {
            applicant: applicant,
            proposer: proposor,
            sponsor: sponsor,
            shares_requested,
            loot_requested,
            tribute_offered,
            tribute_token,
            payment_requested,
            payment_token,
            starting_period: 0,
            yes_votes: 0,
            no_votes: 0,
            flags: flags,
            details: [0; 32],
            max_total_shares_and_loot_at_yes_vote: 0,
            //votes_by_member: 0,
        }
    }
}

pub type ProposalId = u128;
pub type ProposalIndex = u128;
pub type ProposalQueue = ink_storage::collections::Vec<ProposalIndex>;
pub type Proposals = ink_storage::collections::HashMap<ProposalId, Proposal>;
