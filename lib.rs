//! The port of Moloch contract from Ethereum.
#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

/// Define ink! contract.
#[ink::contract]
mod submoloch {
    use ink_storage::traits::{PackedLayout, SpreadLayout};
    use scale::{Decode, Encode};
    use scale_info::TypeInfo;
    use std::collections::{HashMap};

    /* ----------------------------------------------------*
     * Member                                              *
     * ----------------------------------------------------*/

    /// Defines Member.
    #[derive(
        PackedLayout, SpreadLayout, TypeInfo, Encode, Decode, Default, Clone, Eq, PartialEq, Debug,
    )]
    struct Member {
        /// the key responsible for submitting proposals and voting - defaults to member address unless updated
        delegate_key: AccountId,
        /// the # of voting shares assigned to this member
        shares: u128,
        /// the loot amount available to this member (combined with shares on ragequit)
        loot: u128,
        /// always true once a member has been created
        exists: bool,
        // highest proposal index # on which the member voted YES
        highest_index_yes_vote: u128,
        // set to proposalIndex of a passing guild kick proposal for this member, prevents voting on and sponsoring proposals
        jailed: ProposalId,
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

    type Members = Vec<Member>;

    /* ----------------------------------------------------*
     * Proposal                                            *
     * ----------------------------------------------------*/

    #[derive(
        PackedLayout, SpreadLayout, TypeInfo, Encode, Decode, Eq, PartialEq, Debug,
    )]
    enum Vote {
        Yes,
        No
    }

    type ProposalId = u128;
    type ProposalIndex = u128;
    type Proposals = Vec<Proposal>;

    /// Defines Proposal.
    struct Proposal {
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
        votes_by_member: HashMap<AccountId, Option<Vote>>,
    }

    /* ----------------------------------------------------*
     * Event                                               *
     * ----------------------------------------------------*/

    /// Defines SummonComplete event.
    #[ink(event)]
    pub struct SummonComplete {
        #[ink(topic)]
        summoner: AccountId,
        tokens: Vec<AccountId>,
        summoning_time: Timestamp,
        period_duration: u128,
        voting_period_length: u128,
        grace_period_length: u128,
        proposal_deposit: u128,
        dilution_bound: u128,
        processing_reward: u128,
    }
    /// Defines SubmitProposal event.
    #[ink(event)]
    pub struct SubmitProposal {
        #[ink(topic)]
        applicant: AccountId,
        shares_requested: u128,
        loot_requested: u128,
        tribute_offered: u128,
        tribute_token: u128,
        payment_requested: u128,
        payment_token: u128,
        details: u128,
        flags: [bool; 6],
        proposal_id: ProposalId,
        #[ink(topic)]
        delegate_key: AccountId,
        #[ink(topic)]
        member_address: AccountId,
    }
    /// Defines SponsorProposal event.
    #[ink(event)]
    pub struct SponsorProposal {
        #[ink(topic)]
        delegate_key: AccountId,
        #[ink(topic)]
        member_address: AccountId,
        proposal_id: ProposalId,
        proposal_index: ProposalIndex,
        starting_period: u128,
    }
    /// Defines SubmitVote event.
    #[ink(event)]
    pub struct SubmitVote {
        proposal_id: ProposalId,
        #[ink(topic)]
        proposal_index: ProposalIndex,
        delegate_key: AccountId,
        #[ink(topic)]
        member_address: AccountId,
        uint_vote: u128,
    }
    /// Defines ProcessProposal event.
    #[ink(event)]
    pub struct ProcessProposal {
        #[ink(topic)]
        proposal_index: ProposalIndex,
        #[ink(topic)]
        proposal_id: ProposalId,
        did_pass: bool,
    }
    /// Defines ProcessWhitelistProposal event.
    #[ink(event)]
    pub struct ProcessWhitelistProposal {
        #[ink(topic)]
        proposal_index: ProposalIndex,
        #[ink(topic)]
        proposal_id: ProposalId,
        did_pass: bool,
    }
    /// Defines ProcessGuildKickProposal event.
    #[ink(event)]
    pub struct ProcessGuildKickProposal {
        #[ink(topic)]
        proposal_index: ProposalIndex,
        #[ink(topic)]
        proposal_id: ProposalId,
        did_pass: bool,
    }
    /// Defines Rageout event.
    #[ink(event)]
    pub struct Ragequit {
        #[ink(topic)]
        member_address: AccountId,
        shares_to_burn: u128,
        loot_to_burn: u128,
    }
    /// Defines TokenCollected event.
    #[ink(event)]
    pub struct TokensCollected {
        #[ink(topic)]
        token: AccountId,
        amount_to_collect: u128,
    }
    /// Defines CancelProposal event.
    #[ink(event)]
    pub struct CancelProposal {
        #[ink(topic)]
        proposal_id: ProposalId,
        applicant_address: AccountId,
    }
    /// Defines UpdateDelegateKey event.
    #[ink(event)]
    pub struct UpdateDelegateKey {
        #[ink(topic)]
        member_address: AccountId,
        new_delegate_key: AccountId,
    }
    /// Defines Withdraw event.
    #[ink(event)]
    pub struct Withdraw {
        #[ink(topic)]
        member_address: AccountId,
        token: AccountId,
        amount: u128,
    }

    /// Defines the storage of this contract.
    #[ink(storage)]
    pub struct Submoloch {
        members: Members,
    }

    impl Submoloch {
        #[ink(constructor)]
        pub fn new(summoner: AccountId) -> Self {
            let mut members = Vec::new();
            members.push(Member::new(summoner));
            Self { members: members }
        }

        #[ink(constructor)]
        pub fn default() -> Self {
            Self::new(Default::default())
        }

        #[ink(message)]
        pub fn submit_proposal(&self) -> bool {
            false
        }

        #[ink(message)]
        pub fn submit_whitelist_proposal(&self) -> bool {
            false
        }

        #[ink(message)]
        pub fn submit_guildkick_proposal(&self) -> bool {
            false
        }

        #[ink(message)]
        pub fn sponsor_proposal(&self) -> bool {
            false
        }

        #[ink(message)]
        pub fn has_voting_period_expired(&self) -> bool {
            false
        }

        #[ink(message)]
        pub fn submit_vote(&self) -> bool {
            false
        }

        #[ink(message)]
        pub fn process_proposal(&self) -> bool {
            false
        }

        #[ink(message)]
        pub fn process_whitelist_proposal(&self) -> bool {
            false
        }

        #[ink(message)]
        pub fn process_guildkick_proposal(&self) -> bool {
            false
        }

        #[ink(message)]
        pub fn can_ragequit(&self) -> bool {
            false
        }

        #[ink(message)]
        pub fn ragequit(&self) -> bool {
            false
        }

        #[ink(message)]
        pub fn ragekick(&self) -> bool {
            false
        }

        /// To withdraw a single token balance.
        #[ink(message)]
        pub fn withdraw_balance(&self) -> bool {
            false
        }

        /// To withdraw multiple token balances at once.
        #[ink(message)]
        pub fn withdraw_balances(&self) -> bool {
            false
        }

        #[ink(message)]
        pub fn collect_tokens(&self) -> bool {
            false
        }

        #[ink(message)]
        pub fn cancel_proposal(&self) -> bool {
            false
        }

        #[ink(message)]
        pub fn update_delegate_key(&self) -> bool {
            false
        }
    }

    /// Unit tests in Rust are normally defined within such a `#[cfg(test)]`
    /// module and test functions are marked with a `#[test]` attribute.
    /// The below code is technically just normal Rust code.
    #[cfg(test)]
    mod tests {
        /// Imports all the definitions from the outer scope so we can use them here.
        use super::*;

        /// We test if the default constructor does its job.
        #[test]
        fn default_works() {
            let accounts = ink_env::test::default_accounts::<ink_env::DefaultEnvironment>()
                .expect("Cannot get accounts");

            let mut submoloch = Submoloch::new(accounts.alice);
            if let Some(m) = submoloch.members.pop() {
                assert_eq!(m.shares, 1);
            };
        }
    }
}
