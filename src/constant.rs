//! HARD-CODED LIMITS
//! These numbers are quite arbitrary; they are small enough to avoid overflows when doing calculations
//! with periods or shares, yet big enough to not limit reasonable use cases.

/// maximum length of voting period
pub const MAX_VOTING_PERIOD_LENGTH: u128 = 10 ^ 18;
/// maximum length of grace period
pub const MAX_GRACE_PERIOD_LENGTH: u128 = 10 ^ 18;
/// maximum dilution bound
pub const MAX_DILUTION_BOUND: u128 = 10 ^ 18;
/// maximum number of shares that can be minted
pub const MAX_NUMBER_OF_SHARES_AND_LOOT: u128 = 10 ^ 18;
/// maximum number of whitelisted tokens
pub const MAX_TOKEN_WHITELIST_COUNT: u128 = 400;
/// maximum number of tokens with non-zero balance in guildbank
pub const MAX_TOKEN_GUILDBANK_COUNT: u128 = 200;