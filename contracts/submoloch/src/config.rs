//! configuration system.
//! The main entrypoint of the `config` module is the `Config` struct.
use ink_env::AccountId;
use ink_prelude::vec::Vec;
use ink_prelude::string::String;

use crate::constant;
use crate::token::{TokenId};

type Second = u16;
type Period = u128;

#[derive(Builder, Debug, PartialEq)]
#[builder(no_std, build_fn(validate = "Self::validate"))]
pub struct Config {
    #[builder(default)]
    pub approved_tokens: Vec<AccountId>,
    /// default = 17280 = 4.8 hours in seconds (5 periods per day)
    #[builder(default = "17280")]
    pub period_duration: Second,
    /// default = 35 periods (7 days)
    #[builder(default = "35")]
    pub voting_period_length: Period,
    /// default = 35 periods (7 days)
    #[builder(default = "35")]
    pub grace_period_length: Period,
    /// default = 10 ETH (~$1,000 worth of ETH at contract deployment)
    #[builder(default = "10")]
    pub proposal_deposit: u128,
    /// default = 3 - maximum multiplier a YES voter will be obligated to pay in case of mass ragequit
    #[builder(default = "3")]
    pub dilution_bound: u128,
    /// default = 1 - amount of ETH to give to whoever processes a proposal
    #[builder(default = "1")]
    pub processing_reward: u128,
}

impl ConfigBuilder {
    fn validate(&self) -> Result<(), String> {
        self.validate_approved_tokens()
            .and_then(|_| self.validate_period_duration())
            .and_then(|_| self.validate_voting_period_length())
            .and_then(|_| self.validate_grace_period_length())
            .and_then(|_| self.validate_proposal_deposit())
            .and_then(|_| self.validate_dilution_bound())
    }

    fn validate_approved_tokens(&self) -> Result<(), String> {
        if let Some(approved_tokens) = &self.approved_tokens {
            match approved_tokens.len() as u128 {
                0 => Err(String::from("need at least one approved token")),
                n if n > constant::MAX_TOKEN_WHITELIST_COUNT => Err(String::from("Too many tokens")),
                _ => Ok(()),
            }
        } else {
            Ok(())
        }
    }

    fn validate_period_duration(&self) -> Result<(), String> {
        match self.period_duration {
            Some(0) => Err(String::from("period_duration can not be zero")),
            _ => Ok(()),
        }
    }

    fn validate_voting_period_length(&self) -> Result<(), String> {
        match self.voting_period_length {
            Some(0) => Err(String::from("voting_period_length can not be zero")),
            Some(n) if n > constant::MAX_VOTING_PERIOD_LENGTH => {
                Err(String::from("voting_period_length exceeds limit"))
            }
            _ => Ok(()),
        }
    }

    fn validate_grace_period_length(&self) -> Result<(), String> {
        match self.grace_period_length {
            Some(0) => Err(String::from("grace_period_length can not be zero")),
            Some(n) if n > constant::MAX_GRACE_PERIOD_LENGTH => {
                Err(String::from("grace_period_length exceeds limit"))
            }
            _ => Ok(()),
        }
    }

    fn validate_proposal_deposit(&self) -> Result<(), String> {
        match (self.proposal_deposit, self.processing_reward) {
            (Some(a), Some(b)) if a <= b => {
                Err(String::from("proposal_deposit cannot be smaller than processing_reward"))
            }
            _ => Ok(()),
        }
    }

    fn validate_dilution_bound(&self) -> Result<(), String> {
        match self.dilution_bound {
            Some(0) => Err(String::from("dilution_bound cannot be 0")),
            Some(n) if n > constant::MAX_DILUTION_BOUND => {
                Err(String::from("dilution bound exceeds limit"))
            }
            _ => Ok(()),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_works() {
        assert_eq!(
            ConfigBuilder::default().build().unwrap(),
            Config {
                approved_tokens: vec![],
                period_duration: 17280,
                voting_period_length: 35,
                grace_period_length: 35,
                proposal_deposit: 10,
                dilution_bound: 3,
                processing_reward: 1,
            }
        );
    }

    #[test]
    fn overwrite_default_works() {
        let mut builder = ConfigBuilder::default();
        let config = builder
            .period_duration(80)
            .voting_period_length(40)
            .grace_period_length(55)
            .proposal_deposit(44)
            .dilution_bound(5)
            .processing_reward(4)
            .build()
            .unwrap();
        assert_eq!(
            config,
            Config {
                approved_tokens: vec![],
                period_duration: 80,
                voting_period_length: 40,
                grace_period_length: 55,
                proposal_deposit: 44,
                dilution_bound: 5,
                processing_reward: 4,
            }
        );
    }
}
