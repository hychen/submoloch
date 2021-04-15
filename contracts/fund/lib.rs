#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

macro_rules! ensure {
    ($cond:expr, $err:expr $(,)?) => {
        if !$cond {
            return core::result::Result::Err($err);
        }
    };
}

#[ink::contract]
mod fund {
    #[cfg(not(feature = "ink-as-dependency"))]
    use ink_lang as ink;

    #[cfg(not(feature = "ink-as-dependency"))]
    use ink_storage::collections::HashMap as StorageHashMap;

    #[cfg(not(feature = "ink-as-dependency"))]
    use ink_storage::collections::Vec as StorageVec;

    #[cfg(not(feature = "ink-as-dependency"))]
    use ink_prelude::vec::Vec;

    #[derive(Debug, PartialEq, Eq, scale::Encode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        DuplicateTokenError,
        TokenIsntWhitelistError,
    }

    pub type Result<T> = core::result::Result<T, Error>;

    #[ink(event)]
    pub struct AddToWhiteList {
        #[ink(topic)]
        token_id: AccountId,
    }

    #[ink(event)]
    pub struct RemoveFromWhiteList {
        #[ink(topic)]
        token_id: AccountId,
    }

    #[ink::trait_definition]
    pub trait TokenWhitelist {
        #[ink(message)]
        fn get_deposit_token(&self) -> AccountId;
        #[ink(message)]
        fn get_approved_token(&self, index: u32) -> AccountId;
        #[ink(message)]
        fn total_approved_tokens(&self) -> u32;
        #[ink(message)]
        fn whitelist_token(&mut self, token_address: AccountId) -> Result<()>;
        #[ink(message)]
        fn unwhitelist_token(&mut self, token_address: AccountId) -> Result<()>;
        #[ink(message)]
        fn is_token_whitelisted(&self, token_address: AccountId) -> bool;
    }

    #[derive(Default)]
    #[ink(storage)]
    pub struct Fund {
        max_token_whitelist_count: u32,
        token_whitelist: StorageHashMap<AccountId, bool>,
        approved_tokens: StorageVec<AccountId>,
    }

    impl Fund {
        #[ink(constructor)]
        pub fn new(approved_tokens: Vec<AccountId>, max_token_whitelist_count: u32) -> Self {
            assert!(
                approved_tokens.len() as u32 > 0,
                "need at least one approved token"
            );
            assert!(
                approved_tokens.len() as u32 <= max_token_whitelist_count,
                "too many tokens"
            );
            let mut instance = Self::default();
            for i in approved_tokens.iter() {
                assert!(instance.whitelist_token(*i).is_ok(), "instance fail.");
            }
            instance.max_token_whitelist_count;
            instance
        }
    }

    impl TokenWhitelist for Fund {
        #[ink(message)]
        fn get_deposit_token(&self) -> AccountId {
            self.approved_tokens[0]
        }

        #[ink(message)]
        fn get_approved_token(&self, index: u32) -> AccountId {
            self.approved_tokens[index]
        }

        #[ink(message)]
        fn total_approved_tokens(&self) -> u32 {
            self.approved_tokens.len()
        }

        #[ink(message)]
        fn whitelist_token(&mut self, token_id: AccountId) -> Result<()> {
            ensure!(
                !self.is_token_whitelisted(token_id),
                Error::DuplicateTokenError
            );
            self.token_whitelist.insert(token_id, true);
            self.env().emit_event(AddToWhiteList { token_id });
            Ok(())
        }

        #[ink(message)]
        fn unwhitelist_token(&mut self, token_id: AccountId) -> Result<()> {
            ensure!(
                self.is_token_whitelisted(token_id),
                Error::TokenIsntWhitelistError
            );
            self.token_whitelist.insert(token_id, false);
            self.env().emit_event(RemoveFromWhiteList { token_id });
            Ok(())
        }

        #[ink(message)]
        fn is_token_whitelisted(&self, token_id: AccountId) -> bool {
            *self.token_whitelist.get(&token_id).unwrap_or(&false)
        }
    }
}
