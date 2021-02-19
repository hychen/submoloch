//! The port of Moloch contract from Ethereum.
#![cfg_attr(not(feature = "std"), no_std)]
#![feature(alloc)] extern crate alloc;

pub mod member;
pub mod proposal;
pub mod config;
pub mod constant;
pub mod token;

use ink_lang as ink;

#[macro_use]
extern crate derive_builder;

/// Define ink! contract.
#[ink::contract]
mod submoloch {
    use crate::member::{Member, Members};
    use crate::proposal::{Proposal, ProposalId, ProposalIndex};
    use ink_prelude::string::String;
    use ink_prelude::vec::Vec;
    use crate::config::{Config};

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
    #[cfg(not(feature = "ink-as-dependency"))]
    #[derive(Default)]
    #[ink(storage)]
    pub struct Submoloch {
        members: Members,
        token_whitelist: ink_storage::collections::HashMap<AccountId, bool>,
        approved_tokens: ink_storage::collections::Vec<AccountId>,
        period_duration: u128,
        voting_period_length: u128,
        grace_period_length: u128,
        proposal_deposit: u128,
        dilution_bound: u128,
        processing_reward: u128,
        proposed_to_whitelist: ink_storage::collections::HashMap<AccountId, bool>,
        proposed_to_kick: ink_storage::collections::HashMap<AccountId, bool>,
        member_address_by_delegate_key: ink_storage::collections::HashMap<AccountId, AccountId>,
        propsals: ink_storage::collections::HashMap<ProposalId, Proposal>,
        proposal_queue: ink_storage::collections::Vec<ProposalIndex>,
    }

    impl Submoloch {
        #[ink(constructor)]
        pub fn new(
            summoner: AccountId,
            approved_tokens: Vec<AccountId>,
            period_duration: u128,
            voting_period_length: u128,
            grace_period_length: u128,
            proposal_deposit: u128,
            dilution_bound: u128,
            processing_reward: u128,
        ) -> Self {
            let mut instance = Self::default();
            instance.members.push(Member::new(summoner));

            for i in approved_tokens.iter() {
                instance.approved_tokens.push(*i);
            }

            instance.period_duration = period_duration;
            instance.voting_period_length = voting_period_length;
            instance.grace_period_length = grace_period_length;
            instance.proposal_deposit = proposal_deposit;
            instance.dilution_bound = dilution_bound;
            instance.processing_reward = processing_reward;
            instance
        }

        /// Defines a RPC call to submit a proposal.
        #[ink(message)]
        pub fn submit_proposal(
            &self,
            _applicant: AccountId,
            _shares_requested: u128,
            _loot_requested: u128,
            _tribute_offered: u128,
            _tribute_token: AccountId,
            _payment_requested: u128,
            _payment_token: AccountId,
            _details: String,
        ) -> ProposalId {
            unimplemented!()
        }

        /// Defines a RPC call to submit a whitelist proposal.
        #[ink(message)]
        pub fn submit_whitelist_proposal(
            &self,
            _token_to_whitelist: AccountId,
            _details: String,
        ) -> ProposalId {
            unimplemented!()
        }

        /// Defines a RPC call to submit a guildkick proposal.
        #[ink(message)]
        pub fn submit_guildkick_proposal(
            &self,
            _member_to_kick: AccountId,
            _detail: String,
        ) -> ProposalId {
            unimplemented!()
        }

        /// Defines a RPC call to sponsor a proposal.
        #[ink(message)]
        pub fn sponsor_proposal(&self, _proposal_id: ProposalId) -> bool {
            unimplemented!()
        }

        /// Defines a RPC call to checking voting period.
        #[ink(message)]
        pub fn has_voting_period_expired(&self, _starting_period: u128) -> bool {
            unimplemented!()
        }

        /// Defines a RPC call to submit a vote.
        #[ink(message)]
        pub fn submit_vote(&self, _proposal_index: ProposalIndex, _uintvote: u8) -> bool {
            unimplemented!()
        }

        /// Defines a RPC call to process proposal.
        #[ink(message)]
        pub fn process_proposal(&self, _proposal_index: ProposalIndex) -> bool {
            unimplemented!()
        }

        /// Defines a RPC call to process whitelist proposal.
        #[ink(message)]
        pub fn process_whitelist_proposal(&self, _proposal_index: ProposalIndex) -> bool {
            unimplemented!()
        }

        /// Defines a RPC call to process guildkick proposal.
        #[ink(message)]
        pub fn process_guildkick_proposal(&self, _proposal_index: ProposalIndex) -> bool {
            unimplemented!()
        }

        /// Defines a RPC call to check if the member can ragequit.
        #[ink(message)]
        pub fn can_ragequit(&self) -> bool {
            unimplemented!()
        }

        /// Defines a RPC call to ragekick.
        #[ink(message)]
        pub fn ragequit(&self, _shares_to_burn: u128, _loot_to_burn: u128) -> bool {
            unimplemented!()
        }

        /// Defines a RPC call to ragekick.
        #[ink(message)]
        pub fn ragekick(&self, _member_to_kick: AccountId) -> bool {
            unimplemented!()
        }

        /// Defines a RPC call to withdraw a single token balance.
        #[ink(message)]
        pub fn withdraw_balance(&self, _token: AccountId, _amount: u128) -> bool {
            unimplemented!()
        }

        /// Defines a RPC call to withdraw multiple token balances at once.
        #[ink(message)]
        pub fn withdraw_balances(&self, _tokens: Vec<AccountId>, _amounts: Vec<u128>) -> bool {
            unimplemented!()
        }

        #[ink(message)]
        pub fn collect_tokens(&self, _token: AccountId) -> bool {
            unimplemented!()
        }

        #[ink(message)]
        pub fn cancel_proposal(&self, _proposal_id: ProposalId) -> bool {
            unimplemented!()
        }

        #[ink(message)]
        pub fn update_delegate_key(&self, _new_delegate_key: AccountId) -> bool {
            unimplemented!()
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        mod test_constructor {
            use super::*;

            #[test]
            fn verify_deployment_parameters() {
                let accounts = ink_env::test::default_accounts::<ink_env::DefaultEnvironment>()
                    .expect("Cannot get accounts");

                let mut submoloch =
                    Submoloch::new(accounts.alice, Vec::<AccountId>::new(), 0, 0, 0, 0, 0, 0);
                if let Some(m) = submoloch.members.pop() {
                    assert_eq!(m.shares, 1);
                };
                assert!(false);
            }

            #[test]
            fn require_fail_summoner_can_not_be_zero_address() {
                assert!(false);
            }

            #[test]
            fn require_fail_period_duration_can_not_be_zero() {
                assert!(false);
            }

            #[test]
            fn require_fail_voting_period_can_not_be_zero() {
                assert!(false);
            }

            #[test]
            fn require_fail_voting_period_exceeds_limit() {
                assert!(false);
            }

            #[test]
            fn require_fail_grace_period_exceeds_limit() {
                assert!(false);
            }

            #[test]
            fn require_fail_dilution_bound_can_not_be_zero() {
                assert!(false);
            }

            #[test]
            fn require_fail_dilution_bound_exceeds_limit() {
                assert!(false);
            }

            #[test]
            fn require_fail_need_at_least_one_approved_token() {
                assert!(false);
            }

            #[test]
            fn require_fail_too_many_tokens() {
                assert!(false);
            }

            #[test]
            fn require_fail_deposit_cannot_be_smaller_than_processing_reward() {
                assert!(false);
            }

            #[test]
            fn require_fail_approved_token_cannot_be_zero() {
                assert!(false);
            }

            #[test]
            fn require_fail_duplicate_approved_token() {
                assert!(false);
            }
        }

        mod test_submit_proposal {

            #[test]
            fn happy_case() {
                assert!(false);
            }

            #[test]
            fn require_fail_insufficient_tribute_tokens() {
                assert!(false);
            }

            #[test]
            fn require_fail_tribute_token_is_not_whitelisted() {
                assert!(false);
            }

            #[test]
            fn require_fail_payment_token_is_not_whitelisted() {
                assert!(false);
            }

            #[test]
            fn require_fail_applicant_can_not_be_zero() {
                assert!(false);
            }

            #[test]
            fn require_fail_applicant_address_can_not_be_reserved() {
                assert!(false);
            }

            #[test]
            fn failure_too_many_shares_requested() {
                assert!(false);
            }

            #[test]
            fn failure_too_many_shares_just_loot_requested() {
                assert!(false);
            }

            #[test]
            fn failure_too_many_shares_plus_loot_requested() {
                assert!(false);
            }

            #[test]
            fn happy_case_second_submitted_proposal_returns_incremented_proposalid() {
                assert!(false);
            }
        }

        mod test_submit_whitelist_proposal {

            #[test]
            fn happy_case() {
                assert!(false);
            }

            #[test]
            fn require_fail_applicant_can_not_be_zero() {
                assert!(false);
            }

            #[test]
            fn require_fail_cannot_add_already_have_whitelisted_the_token() {
                assert!(false);
            }

            #[test]
            fn happy_case_second_submitted_proposal_returns_incremented_proposalid() {
                assert!(false);
            }
        }

        mod sponsor_proposal {

            #[test]
            fn happy_path_sponsor_add_token_to_whitelist() {
                assert!(false);
            }

            #[test]
            fn with_a_second_member_besides_the_summoner() {
                assert!(false);
            }

            #[test]
            fn happy_path_sponsor_proposal() {
                assert!(false);
            }

            #[test]
            fn failure_proposal_has_already_been_sponsored() {
                assert!(false);
            }

            #[test]
            fn failure_proposal_has_been_cancelled() {
                assert!(false);
            }

            #[test]
            fn failure_sponsor_whitelist_token_proposal_already_proposed() {
                assert!(false);
            }

            #[test]
            fn require_fail_insufficient_deposit_token() {
                assert!(false);
            }

            #[test]
            fn require_fail_sponsor_non_existant_proposal_fails() {
                assert!(false);
            }
        }

        mod whitelist_proposals_token_conflict {

            #[test]
            fn when_the_first_whitelist_proposal_passes_the_second_can_no_longer_be_sponsored() {
                assert!(false);
            }

            #[test]
            fn when_the_first_whitelist_proposal_fails_the_second_can_still_be_sponsored() {
                assert!(false);
            }
        }

        mod test_submit_vote {

            #[test]
            fn happy_case_yes_vote() {
                assert!(false);
            }

            #[test]
            fn happy_case_no_vote() {
                assert!(false);
            }

            #[test]
            fn require_fail_proposal_does_not_exist() {
                assert!(false);
            }

            #[test]
            fn require_fail_vote_must_be_less_than_3() {
                assert!(false);
            }

            #[test]
            fn require_fail_voting_period_has_not_started() {
                assert!(false);
            }

            #[test]
            fn voting_period_boundary() {
                assert!(false);
            }

            #[test]
            fn require_fail_member_has_already_voted() {
                assert!(false);
            }

            #[test]
            fn require_fail_vote_must_be_yes_or_no() {
                assert!(false);
            }

            #[test]
            fn modifier_delegate() {
                assert!(false);
            }

            #[test]
            fn modifying_member_highestindexyesvote() {
                assert!(false);
            }
        }

        mod process_proposal {

            #[test]
            fn happy_path_pass_yes_wins() {
                assert!(false);
            }

            #[test]
            fn happy_path_fail_no_wins_proposer_gets_funds_back() {
                assert!(false);
            }

            #[test]
            fn happy_path_shares_added_to_existing_member() {
                assert!(false);
            }

            #[test]
            fn happy_path_applicant_is_used_as_a_delegate_key_so_delegate_key_is_reset() {
                assert!(false);
            }

            #[test]
            fn happy_path_auto_fail_if_shares_exceed_limit() {
                assert!(false);
            }

            #[test]
            fn happy_path_auto_fail_if_loot_shares_exceed_limit() {
                assert!(false);
            }

            #[test]
            fn happy_path_token_whitelist() {
                assert!(false);
            }

            #[test]
            fn happy_path_guild_kick_member() {
                assert!(false);
            }

            #[test]
            fn edge_case_paymentrequested_more_than_funds_in_the_bank() {
                assert!(false);
            }

            #[test]
            fn edge_case_dilution_bound_is_exceeded() {
                assert!(false);
            }

            #[test]
            fn require_fail_proposal_does_not_exist() {
                assert!(false);
            }

            #[test]
            fn require_fail_proposal_is_not_ready_to_be_processed() {
                assert!(false);
            }

            #[test]
            fn require_fail_proposal_has_already_been_processed() {
                assert!(false);
            }

            #[test]
            fn require_fail_previous_proposal_must_be_processed() {
                assert!(false);
            }

            #[test]
            fn require_fail_must_be_a_whitelist_proposal() {
                assert!(false);
            }

            #[test]
            fn require_fail_must_be_a_guild_kick_proposal() {
                assert!(false);
            }

            #[test]
            fn require_fail_must_be_a_standard_process_not_a_whitelist_proposal() {
                assert!(false);
            }

            #[test]
            fn require_fail_must_be_a_standard_process_not_a_guild_kick_proposal() {
                assert!(false);
            }
        }

        mod ragequit_plus_withdrawbalance {

            #[test]
            fn full_ragequit() {
                assert!(false);
            }

            #[test]
            fn partial_shares() {
                assert!(false);
            }

            #[test]
            fn require_fail() {
                assert!(false);
            }

            #[test]
            fn withdraw_balance() {
                assert!(false);
            }
        }
    }

    mod cancel_proposal {

        #[test]
        fn happy_case() {
            assert!(false);
        }

        #[test]
        fn failure_already_sponsored() {
            assert!(false);
        }

        #[test]
        fn failure_already_cancelled() {
            assert!(false);
        }

        #[test]
        fn failure_solely_the_proposer_can_cancel() {
            assert!(false);
        }
    }

    mod update_delegate_key {

        #[test]
        fn happy_case() {
            assert!(false);
        }

        #[test]
        fn failure_can_not_be_zero_address() {
            assert!(false);
        }

        #[test]
        fn failure_cant_overwrite_existing_members() {
            assert!(false);
        }

        #[test]
        fn failure_cant_overwrite_existing_delegate_keys() {
            assert!(false);
        }
    }

    mod can_rage_quit {

        #[test]
        fn happy_case() {
            assert!(false);
        }

        #[test]
        fn failure_proposal_does_not_exist() {
            assert!(false);
        }

        #[test]
        fn ragekick() {
            assert!(false);
        }
    }

    mod ragekick {

        #[test]
        fn failure_member_must_be_in_jail() {
            assert!(false);
        }
    }

    mod ragekick_member_has_never_voted {

        #[test]
        fn ragekick_happy_case_can_ragekick_immediately_after_guild_kick() {
            assert!(false);
        }

        #[test]
        fn ragekick_failure_member_must_have_some_loot() {
            assert!(false);
        }
    }

    mod ragekick_member_voted_on_later_proposal {

        #[test]
        fn happy_case_can_ragekick_after_second_membership_proposal_is_processed() {
            assert!(false);
        }

        #[test]
        fn ragekick_boundary_condition_must_wait_for_highestindexyesvote_propopsal_to_be_processed()
        {
            assert!(false);
        }
    }

    mod get_member_proposal_vote {

        #[test]
        fn happy_case() {
            assert!(false);
        }

        #[test]
        fn failure_member_does_not_exist() {
            assert!(false);
        }

        #[test]
        fn failure_proposal_does_not_exist() {
            assert!(false);
        }
    }

    mod as_a_member_with_solely_loot_and_no_shares {

        #[test]
        fn can_still_ragequit_justmember_modifier() {
            assert!(false);
        }

        #[test]
        fn can_still_partial_ragequit_justmember_modifier() {
            assert!(false);
        }

        #[test]
        fn unable_to_update_delegatekey_justshareholder_modifier() {
            assert!(false);
        }

        #[test]
        fn unable_to_use_delegate_key_to_sponsor_justshareholder_modifier() {
            assert!(false);
        }

        #[test]
        fn unable_to_use_delegate_key_to_vote_justdelegate_modifier() {
            assert!(false);
        }

        mod jail_effects {

            #[test]
            fn cant_process_proposals_for_a_jailed_applicant() {
                assert!(false);
            }

            #[test]
            fn cant_sponsor_proposals_for_a_jailed_applicant() {
                assert!(false);
            }

            #[test]
            fn cant_sponsor_guild_kick_proposals_for_a_jailed_applicant() {
                assert!(false);
            }

            #[test]
            fn cant_submit_proposals_for_a_jailed_applicant() {
                assert!(false);
            }

            #[test]
            fn cant_submit_guild_kick_proposals_for_a_jailed_applicant() {
                assert!(false);
            }
        }
    }
}
