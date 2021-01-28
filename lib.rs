#![cfg_attr(not(feature = "std"), no_std)]

use ink_lang as ink;

#[ink::contract]
mod submoloch {
    use scale::{Encode, Decode};
    use scale_info::{TypeInfo};
    use ink_storage::traits::{PackedLayout, SpreadLayout};

    /// Defines Member.
    #[derive(PackedLayout, SpreadLayout, TypeInfo, Encode, Decode, Default, Clone, Eq, PartialEq, Debug)]
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
      jailed: u128
    }

    impl Member {
      pub fn new(_delegate_key: AccountId) -> Self {
        Self {
          delegate_key: _delegate_key,
          shares: 1,
          loot: 0,
          exists: true,
          highest_index_yes_vote: 0,
          jailed: 0
        }
      }
    }

    type Members = Vec<Member>;

    /// Defines the storage of your contract.
    /// Add new fields to the below struct in order
    /// to add new static storage fields to your contract.
    #[ink(storage)]
    pub struct Submoloch {
        members: Members
    }

    impl Submoloch {
        /// Constructor that initializes the `bool` value to the given `init_value`.
        #[ink(constructor)]
        pub fn new(summoner: AccountId) -> Self {
            let mut members = Vec::new();
            members.push(Member::new(summoner));
            Self { members: members }
        }

        /// Constructor that initializes the `bool` value to `false`.
        ///
        /// Constructors can delegate to other constructors.
        #[ink(constructor)]
        pub fn default() -> Self {
            Self::new(Default::default())
        }

        /// Simply returns the current value of our `bool`.
        #[ink(message)]
        pub fn get(&self) -> bool {
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
          let accounts =
          ink_env::test::default_accounts::<ink_env::DefaultEnvironment>().expect("Cannot get accounts");

          let mut submoloch = Submoloch::new(accounts.alice);
          if let Some(m) =  submoloch.members.pop() {
            print!(m.delegate_key);
            assert_eq!(m.shares, 1);
          };
        }
    }
}
