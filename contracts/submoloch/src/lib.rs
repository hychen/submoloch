//! The port of Moloch contract from Ethereum.
#![cfg_attr(not(feature = "std"), no_std)]

pub mod constant;
pub mod member;
pub mod proposal;

use ink_lang as ink;

/// Define ink! contract.
#[ink::contract(dynamic_storage_allocator = true)]
mod submoloch {
    use ink_prelude::string::String;
    use ink_prelude::vec::Vec;

    use crate::constant;
    use crate::member::{Member, Members};
    use crate::proposal::{Proposal, ProposalId, ProposalIndex};
    use erc20::Erc20;
    use ink_env::call::FromAccountId;
    use ink_prelude::format;
    use ink_prelude::string::String;
    use ink_prelude::vec::Vec;

    const GUILD:[u8; 32] = [0x05,0x6f,0xac,0xa2,
        0xf8,0x5a,0x10,0xbb,
        0x2f,0xdd,0xce,0x63,
        0x83,0xc9,0x60,0x98,
        0x2d,0x22,0xd1,0xbd,
        0x46,0x2e,0x66,0x10,
        0x94,0xa2,0xb8,0x57,
        0x74,0xa8,0x17,0x4f];
    const ESCROW:[u8;32] = [0x05,0x6f,0xac,0xa2,
        0xf8,0x5a,0x10,0xbb,
        0x2f,0xdd,0xce,0x63,
        0x83,0xc9,0x60,0x98,
        0x2d,0x22,0xd1,0xbd,
        0x46,0x2e,0x66,0x10,
        0x94,0xa2,0xb8,0x57,
        0x74,0xa8,0x17,0x4e];
    const TOTAL:[u8;32] = [0x05,0x6f,0xac,0xa2,
        0xf8,0x5a,0x10,0xbb,
        0x2f,0xdd,0xce,0x63,
        0x83,0xc9,0x60,0x98,
        0x2d,0x22,0xd1,0xbd,
        0x46,0x2e,0x66,0x10,
        0x94,0xa2,0xb8,0x57,
        0x74,0xa8,0x17,0x4b];

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
        period_duration: u16,
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
        applicant: Option<AccountId>,
        shares_requested: u128,
        loot_requested: u128,
        tribute_offered: Option<u128>,
        tribute_token: Option<AccountId>,
        payment_requested: Option<u128>,
        payment_token: Option<AccountId>,
        details: String,
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
        period_duration: u16,
        voting_period_length: u128,
        grace_period_length: u128,
        proposal_deposit: u128,
        dilution_bound: u128,
        processing_reward: u128,
        proposed_to_whitelist: ink_storage::collections::HashMap<AccountId, bool>,
        proposed_to_kick: ink_storage::collections::HashMap<AccountId, bool>,
        member_address_by_delegate_key: ink_storage::collections::HashMap<AccountId, AccountId>,
        proposals: ink_storage::collections::HashMap<ProposalId, Proposal>,
        proposal_queue: ink_storage::collections::Vec<ProposalIndex>,
        /// total proposals submitted
        proposal_count: u128,
        /// total shares across all members
        total_shares: u128,
        /// total loot across all members
        total_loot: u128,
        /// total tokens with non-zero balance in guild bank
        total_guild_bank_tokens: u128,
        user_token_balances: ink_storage::collections::HashMap<(AccountId, AccountId), Balance>,
        summoning_time: Timestamp,
    }

    impl Submoloch {
        #[ink(constructor)]
        pub fn new(
            summoner: AccountId,
            approved_tokens: Vec<AccountId>,
            period_duration: u16,
            voting_period_length: u128,
            grace_period_length: u128,
            proposal_deposit: u128,
            dilution_bound: u128,
            processing_reward: u128,
        ) -> Self {
            assert!(period_duration > 0, "_periodDuration cannot be 0");
            assert!(voting_period_length > 0, "_votingPeriodLength cannot be 0");
            assert!(
                voting_period_length <= constant::MAX_VOTING_PERIOD_LENGTH,
                "_votingPeriodLength exceeds limit"
            );
            assert!(
                grace_period_length <= constant::MAX_GRACE_PERIOD_LENGTH,
                "_gracePeriodLength exceeds limit"
            );
            assert!(dilution_bound > 0, "_dilutionBound cannot be 0");
            assert!(
                dilution_bound <= constant::MAX_DILUTION_BOUND,
                "_dilutionBound exceeds limit"
            );
            assert!(
                approved_tokens.len() as u128 > 0,
                "need at least one approved token"
            );
            assert!(
                approved_tokens.len() as u128 <= constant::MAX_TOKEN_WHITELIST_COUNT,
                "too many tokens"
            );
            assert!(
                proposal_deposit >= processing_reward,
                "_proposalDeposit cannot be smaller than _processingReward"
            );

            let mut instance = Self::default();

            for i in approved_tokens.iter() {
                assert!(
                    !instance.token_whitelist.contains_key(i),
                    "duplicate approved token"
                );
                instance.token_whitelist.insert(*i, true);
                instance.approved_tokens.push(*i);
            }

            instance.period_duration = period_duration;
            instance.voting_period_length = voting_period_length;
            instance.grace_period_length = grace_period_length;
            instance.proposal_deposit = proposal_deposit;
            instance.dilution_bound = dilution_bound;
            instance.processing_reward = processing_reward;
            instance.summoning_time = instance.env().block_timestamp();

            let first_member = Member {
                delegate_key: summoner,
                shares: 1,
                loot: 0,
                exists: true,
                highest_index_yes_vote: 0,
                jailed: 0,
            };
            instance.total_shares = first_member.shares;
            instance.members.insert(summoner, first_member);
            instance
                .member_address_by_delegate_key
                .insert(summoner, summoner);

            // NOTE: move event up here, avoid stack too deep if too many approved tokens
            instance.env().emit_event(SummonComplete {
                summoner,
                tokens: approved_tokens,
                summoning_time: instance.summoning_time,
                period_duration,
                voting_period_length,
                grace_period_length,
                proposal_deposit,
                dilution_bound,
                processing_reward,
            });
            instance
        }

        #[ink(message)]
        pub fn deposit_token(&self) -> AccountId {
            self.approved_tokens[0]
        }

        #[ink(message)]
        pub fn members(&self, account_id: AccountId) -> Option<Member> {
            self.members.get(&account_id).copied()
        }

        #[ink(message)]
        pub fn member_address_by_delegate_key(&self, account_id: AccountId) -> Option<AccountId> {
            self.member_address_by_delegate_key
                .get(&account_id)
                .copied()
        }

        #[ink(message)]
        pub fn approved_tokens(&self, index: u32) -> AccountId {
            self.approved_tokens[index]
        }

        #[ink(message)]
        pub fn token_whitelist(&self, token_address: AccountId) -> bool {
            self.token_whitelist
                .get(&token_address)
                .copied()
                .unwrap_or(false)
        }

        #[ink(message)]
        pub fn period_duration(&self) -> u16 {
            self.period_duration
        }

        #[ink(message)]
        pub fn voting_period_length(&self) -> u128 {
            self.voting_period_length
        }

        #[ink(message)]
        pub fn grace_period_length(&self) -> u128 {
            self.grace_period_length
        }

        #[ink(message)]
        pub fn proposal_deposit(&self) -> u128 {
            self.proposal_deposit
        }

        #[ink(message)]
        pub fn dilution_bound(&self) -> u128 {
            self.dilution_bound
        }

        #[ink(message)]
        pub fn proposal_count(&self) -> u128 {
            self.proposal_count
        }

        #[ink(message)]
        pub fn total_shares(&self) -> u128 {
            self.total_shares
        }

        #[ink(message)]
        pub fn total_loot(&self) -> u128 {
            self.total_loot
        }

        #[ink(message)]
        pub fn total_guild_bank_tokens(&self) -> u128 {
            self.total_guild_bank_tokens
        }

        #[ink(message)]
        pub fn get_current_period(&self) -> u16 {
            (self.env().block_timestamp() - self.summoning_time) as u16 / self.period_duration
        }

        #[ink(message)]
        pub fn processing_reward(&self) -> u128 {
            self.processing_reward
        }

        /// Defines a RPC call to submit a proposal.
        #[ink(message)]
        pub fn submit_proposal(
            &mut self,
            applicant: AccountId,
            shares_requested: u128,
            loot_requested: u128,
            tribute_offered: u128,
            tribute_token: AccountId,
            payment_requested: u128,
            payment_token: AccountId,
            details: String,
        ) -> ProposalId {
            assert!(
                (shares_requested + loot_requested) <= constant::MAX_NUMBER_OF_SHARES_AND_LOOT,
                "too many shares requested"
            );
            assert!(
                *self.token_whitelist.get(&tribute_token).unwrap_or(&false),
                "tributeToken is not whitelisted"
            );
            assert!(
                *self.token_whitelist.get(&payment_token).unwrap_or(&false),
                "payment is not whitelisted"
            );
            assert!(applicant != AccountId::default(), "applicant cannot be 0");
            assert!(
                applicant != AccountId::from(GUILD) && applicant != AccountId::from(ESCROW) && applicant != AccountId::from(TOTAL),
                "applicant address cannot be reserved"
            );
            assert!(
                self.members.get(&applicant).unwrap().jailed == 0,
                "proposal applicant must not be jailed"
            );

            if tribute_offered > 0
                && *self
                    .user_token_balances
                    .get(&(AccountId::from(GUILD), tribute_token))
                    .unwrap_or(&0)
                    == 0
            {
                assert!(
                    self.total_guild_bank_tokens < constant::MAX_TOKEN_GUILDBANK_COUNT,
                    "cannot submit more tribute proposals for new tokens - guildbank is full"
                );
            }

            let flags: [bool; 6] = Default::default(); // [sponsored, processed, didPass, cancelled, whitelist, guildkick]

            // collect tribute from proposer and store it in the Moloch until the proposal is processed
            let mut token = Erc20::from_account_id(tribute_token);
            assert!(token
                .transfer_from(
                    self.env().caller(),
                    self.env().account_id(),
                    tribute_offered
                )
                .is_ok());
            self.unsafe_add_to_balance(AccountId::from(ESCROW), tribute_token, tribute_offered);

            self._submit_proposal(
                Some(applicant),
                shares_requested,
                loot_requested,
                Some(tribute_offered),
                Some(tribute_token),
                Some(payment_requested),
                Some(payment_token),
                details,
                flags,
            );
            self.proposal_count - 1 // return proposalId - contracts calling submit might want it
        }

        /// Defines a RPC call to submit a whitelist proposal.
        #[ink(message)]
        pub fn submit_whitelist_proposal(
            &mut self,
            token_to_whitelist: AccountId,
            details: String,
        ) -> ProposalId {
            // assert_eq!(tokenToWhitelist != address(0), "must provide token address");
            assert!(
                !*self
                    .token_whitelist
                    .get(&token_to_whitelist)
                    .unwrap_or(&false),
                "cannot already have whitelisted the token"
            );
            assert!(
                (self.approved_tokens.len() as u128) < constant::MAX_TOKEN_WHITELIST_COUNT,
                "cannot submit more whitelist proposals"
            );

            let mut flags: [bool; 6] = Default::default(); // [sponsored, processed, didPass, cancelled, whitelist, guildkick]
            flags[4] = true; // whitelist

            self._submit_proposal(
                None,
                0,
                0,
                Some(0),
                Some(token_to_whitelist),
                None,
                None,
                details,
                flags,
            );
            self.proposal_count - 1
        }

        /// Defines a RPC call to submit a guildkick proposal.
        #[ink(message)]
        pub fn submit_guildkick_proposal(
            &mut self,
            member_to_kick: AccountId,
            details: String,
        ) -> ProposalId {
            let member = self.members.get(&member_to_kick).unwrap();

            assert!(
                member.shares > 0 || member.loot > 0,
                "member must have at least one share or one loot"
            );
            assert!(member.jailed == 0, "member must not already be jailed");

            // [sponsored, processed, didPass, cancelled, whitelist, guildkick]
            let mut flags: [bool; 6] = Default::default();
            flags[5] = true; // guild kick

            self._submit_proposal(
                Some(member_to_kick),
                0,
                0,
                None,
                None,
                None,
                None,
                details,
                flags,
            );
            self.proposal_count - 1
        }

        fn _submit_proposal(
            &mut self,
            applicant: Option<AccountId>,
            shares_requested: u128,
            loot_requested: u128,
            tribute_offered: Option<u128>,
            tribute_token: Option<AccountId>,
            payment_requested: Option<u128>,
            payment_token: Option<AccountId>,
            details: String,
            flags: [bool; 6],
        ) {
            let caller = self.env().caller();
            let proposal = Proposal::new(
                applicant,
                caller,
                None,
                shares_requested,
                loot_requested,
                tribute_offered,
                tribute_token,
                payment_requested,
                payment_token,
                details.clone(),
                flags,
            );

            self.proposals.insert(self.proposal_count, proposal);
            let member_address = *self.member_address_by_delegate_key.get(&caller).unwrap();

            self.env().emit_event(SubmitProposal {
                applicant,
                shares_requested,
                loot_requested,
                tribute_offered,
                tribute_token,
                payment_requested,
                payment_token,
                details,
                flags,
                proposal_id: self.proposal_count,
                delegate_key: caller,
                member_address,
            });
            self.proposal_count += 1
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

        /***************
        HELPER FUNCTIONS
        ***************/
        fn unsafe_add_to_balance(&mut self, user: AccountId, token: AccountId, amount: Balance) {
            self.user_token_balances
                .entry((user, token))
                .and_modify(|old_value| *old_value += amount);
            self.user_token_balances
                .entry((AccountId::from(TOTAL), token))
                .and_modify(|old_value| *old_value += amount);
        }
    }
}
