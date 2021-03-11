import BN from 'bn.js';
import * as chai from 'chai';
import { expect } from 'chai';
const { assert } = chai;

import { patract, network } from 'redspot';

chai
  .use(require('chai-as-promised'))
  .should();

const { getContractFactory, getRandomSigner } = patract;

const { api, getSigners } = network;



const revertMessages = {
  molochConstructorSummonerCannotBe0: 'summoner cannot be 0',
  molochConstructorPeriodDurationCannotBe0: '_periodDuration cannot be 0',
  molochConstructorVotingPeriodLengthCannotBe0: '_votingPeriodLength cannot be 0',
  molochConstructorVotingPeriodLengthExceedsLimit: '_votingPeriodLength exceeds limit',
  molochConstructorGracePeriodLengthExceedsLimit: '_gracePeriodLength exceeds limit',
  molochConstructorDilutionBoundCannotBe0: '_dilutionBound cannot be 0',
  molochConstructorDilutionBoundExceedsLimit: '_dilutionBound exceeds limit',
  molochConstructorNeedAtLeastOneApprovedToken: 'need at least one approved token',
  molochConstructorTooManyTokens: 'too many tokens',
  molochConstructorDepositCannotBeSmallerThanProcessingReward: '_proposalDeposit cannot be smaller than _processingReward',
  molochConstructorApprovedTokenCannotBe0: '_approvedToken cannot be 0',
  molochConstructorDuplicateApprovedToken: 'revert duplicate approved token',
  submitProposalTooManySharesRequested: 'too many shares requested',
  submitProposalProposalMustHaveBeenProposed: 'proposal must have been proposed',
  submitProposalTributeTokenIsNotWhitelisted: 'tributeToken is not whitelisted',
  submitProposalPaymetTokenIsNotWhitelisted: 'payment is not whitelisted',
  submitProposalApplicantCannotBe0: 'revert applicant cannot be 0',
  submitProposalApplicantCannotBeReserved: 'applicant address cannot be reserved',
  submitProposalApplicantIsJailed: 'proposal applicant must not be jailed',
  submitWhitelistProposalMustProvideTokenAddress: 'must provide token address',
  submitWhitelistProposalAlreadyHaveWhitelistedToken: 'cannot already have whitelisted the token',
  submitGuildKickProposalMemberMustHaveAtLeastOneShare: 'member must have at least one share or one loot',
  submitGuildKickProposalMemberMustNotBeJailed: 'member must not already be jailed',
  sponsorProposalProposalHasAlreadyBeenSponsored: 'proposal has already been sponsored',
  sponsorProposalProposalHasAlreadyBeenCancelled: 'proposal has already been cancelled',
  sponsorProposalAlreadyProposedToWhitelist: 'already proposed to whitelist',
  sponsorProposalAlreadyWhitelisted: 'cannot already have whitelisted the token',
  sponsorProposalAlreadyProposedToKick: 'already proposed to kick',
  sponsorProposalApplicantIsJailed: 'proposal applicant must not be jailed',
  submitVoteProposalDoesNotExist: 'proposal does not exist',
  submitVoteMustBeLessThan3: 'must be less than 3',
  submitVoteVotingPeriodHasNotStarted: 'voting period has not started',
  submitVoteVotingPeriodHasExpired: 'voting period has expired',
  submitVoteMemberHasAlreadyVoted: 'member has already voted',
  submitVoteVoteMustBeEitherYesOrNo: 'vote must be either Yes or No',
  cancelProposalProposalHasAlreadyBeenSponsored: 'proposal has already been sponsored',
  cancelProposalSolelyTheProposerCanCancel: 'solely the proposer can cancel',
  processProposalProposalDoesNotExist: 'proposal does not exist',
  processProposalProposalIsNotReadyToBeProcessed: 'proposal is not ready to be processed',
  processProposalProposalHasAlreadyBeenProcessed: 'proposal has already been processed',
  processProposalPreviousProposalMustBeProcessed: 'previous proposal must be processed',
  processProposalMustBeAStandardProposal: 'must be a standard proposal',
  processWhitelistProposalMustBeAWhitelistProposal: 'must be a whitelist proposal',
  processGuildKickProposalMustBeAGuildKickProposal: 'must be a guild kick proposal',
  notAMember: 'not a member',
  notAShareholder: 'not a shareholder',
  rageQuitInsufficientShares: 'insufficient shares',
  rageQuitInsufficientLoot: 'insufficient loot',
  rageQuitUntilHighestIndex: 'cannot ragequit until highest index proposal member voted YES on is processed',
  withdrawBalanceInsufficientBalance: 'insufficient balance',
  updateDelegateKeyNewDelegateKeyCannotBe0: 'newDelegateKey cannot be 0',
  updateDelegateKeyCantOverwriteExistingMembers: 'cannot overwrite existing members',
  updateDelegateKeyCantOverwriteExistingDelegateKeys: 'cannot overwrite existing delegate keys',
  canRageQuitProposalDoesNotExist: 'proposal does not exist',
  ragekickMustBeInJail: 'member must be in jail',
  ragekickMustHaveSomeLoot: 'member must have some loot',
  ragekickPendingProposals: 'cannot ragequit until highest index proposal member voted YES on is processed',
  getMemberProposalVoteMemberDoesntExist: 'member does not exist',
  getMemberProposalVoteProposalDoesntExist: 'proposal does not exist',
}

const SolRevert = 'VM Exception while processing transaction: revert'

const zeroAddress = '0x0000000000000000000000000000000000000000'
const GUILD = '0x000000000000000000000000000000000000dead'
const ESCROW = '0x000000000000000000000000000000000000beef'
const TOTAL = '0x000000000000000000000000000000000000babe'
const MAX_TOKEN_WHITELIST_COUNT = new BN('100') // TODO: actual number to be determined

const _1 = new BN('1')
const _1e18 = new BN('1000000000000000000') // 1e18
const _1e18Plus1 = _1e18.add(_1)
const _1e18Minus1 = _1e18.sub(_1)

const deploymentConfig = {
  'PERIOD_DURATION_IN_SECONDS': 17280,
  'VOTING_DURATON_IN_PERIODS': 35,
  'GRACE_DURATON_IN_PERIODS': 35,
  'PROPOSAL_DEPOSIT': 10,
  'DILUTION_BOUND': 3,
  'PROCESSING_REWARD': 1,
  'TOKEN_SUPPLY': 10000
}

async function addressArray(length) {
  // returns an array of distinct non-zero addresses
  let array: string[] = []
  for (let i = 1; i <= length; i++) {
    const signer = await getRandomSigner();
    array.push(signer.address);
  }
  return array
}

async function setup() {
  const one = new BN(10).pow(new BN(api.registry.chainDecimals[0]));
  const signers = await getSigners();
  const creator = signers[0];
  const summoner = signers[1];
  const TokenContractFactory = await getContractFactory('erc20', creator);
  const tokenAlpha = await TokenContractFactory.deploy('BaseErc20,new', deploymentConfig.TOKEN_SUPPLY);
  const SubMolochContractFactory = await getContractFactory('submoloch', creator);
  const submoloch = await SubMolochContractFactory.deploy('new',
    summoner.address,
    [tokenAlpha.address],
    deploymentConfig.PERIOD_DURATION_IN_SECONDS,
    deploymentConfig.VOTING_DURATON_IN_PERIODS,
    deploymentConfig.GRACE_DURATON_IN_PERIODS,
    deploymentConfig.PROPOSAL_DEPOSIT,
    deploymentConfig.DILUTION_BOUND,
    deploymentConfig.PROCESSING_REWARD
  );
  return { creator, summoner, tokenAlpha, submoloch, SubMolochContractFactory, TokenContractFactory };
}

describe('Submoloch', () => {

  const initSummonerBalance = 100;

  const firstProposalIndex = 0;
  const secondProposalIndex = 1;
  const thirdProposalIndex = 2;
  const invalidPropsalIndex = 123;

  const yes = 1;
  const no = 2;

  const standardShareRequest = 100;
  const standardLootRequest = 73;
  const standardTribute = 80;
  const summonerShares = 1;

  api.registerTypes({
    'ProposalId': 'u128',
    'Member': {
      'delegateKey': 'AccountId',
      'shares': 'u128',
      'loot': 'u128',
      'exists': 'bool',
      'highestIndexYesVote': 'u128',
      'jailed': 'ProposalId',
    }
  });

  after(() => {
    return api.disconnect();
  });

  describe('contractor', async () => {

    it('verify deployment parameters', async () => {
      const { creator, summoner, tokenAlpha, submoloch } = await setup();
      const depositToken = tokenAlpha;

      // transfer initial funds.
      await tokenAlpha.tx['baseErc20,transfer'](summoner.address, initSummonerBalance, { from: creator.address });

      // const now = await api.query.timestamp.now();

      const depositTokenAddress = await submoloch.query.depositToken();
      assert.deepEqual(depositTokenAddress.output, tokenAlpha.address);

      const proposalCount = await submoloch.proposalCount();
      assert.equal(proposalCount.output, 0)

      const periodDuration = await submoloch.periodDuration();
      assert.equal(periodDuration.output, deploymentConfig.PERIOD_DURATION_IN_SECONDS)

      const votingPeriodLength = await submoloch.votingPeriodLength();
      assert.equal(votingPeriodLength.output, deploymentConfig.VOTING_DURATON_IN_PERIODS)

      const gracePeriodLength = await submoloch.gracePeriodLength();
      assert.equal(gracePeriodLength.output, deploymentConfig.GRACE_DURATON_IN_PERIODS)

      const proposalDeposit = await submoloch.proposalDeposit();
      assert.equal(proposalDeposit.output, deploymentConfig.PROPOSAL_DEPOSIT)

      const dilutionBound = await submoloch.dilutionBound();
      assert.equal(dilutionBound.output, deploymentConfig.DILUTION_BOUND)

      const processingReward = await submoloch.processingReward()
      assert.equal(processingReward.output, deploymentConfig.PROCESSING_REWARD)

      const currentPeriod = await submoloch.getCurrentPeriod();
      assert.equal(currentPeriod.output, 0);

      // @ts-ignore
      let summonerData = (await submoloch.query.members(summoner.address))?.output.unwrap();
      // @ts-ignore  
      expect(summonerData?.delegateKey).to.eq(summoner.address); // delegateKey matches
      // @ts-ignore
      assert.equal(+summonerData?.shares, summonerShares);
      // @ts-ignore
      assert.equal(summonerData?.exists, true);
      // @ts-ignore
      assert.equal(+summonerData?.highestIndexYesVote, 0);

      const summonerAddressByDelegateKey = await submoloch.query.memberAddressByDelegateKey(summoner.address);
      /// XXX: assert.equal does not work here.
      expect(summonerAddressByDelegateKey.output).to.eq(summoner.address);

      const totalShares = await submoloch.totalShares();
      assert.equal(totalShares.output, summonerShares);

      const totalRoot = (await submoloch.totalLoot());
      assert.equal(totalRoot.output, 0);

      const totalGuildBankTokens = await submoloch.totalGuildBankTokens()
      assert.equal(+totalGuildBankTokens.output, 0)

      // confirm initial deposit token supply and summoner balance
      const tokenSupply = (await tokenAlpha['baseErc20,totalSupply']()).output;
      assert.equal(tokenSupply, deploymentConfig.TOKEN_SUPPLY)
      const summonerBalance = (await tokenAlpha['baseErc20,balanceOf'](summoner.address)).output;
      assert.equal(summonerBalance, initSummonerBalance)
      const creatorBalance = (await tokenAlpha['baseErc20,balanceOf'](creator.address)).output;
      assert.equal(creatorBalance, deploymentConfig.TOKEN_SUPPLY - initSummonerBalance)

      // check all tokens passed in construction are approved
      const tokenAlphaApproved = await submoloch.tokenWhitelist(tokenAlpha.address);
      assert.equal(tokenAlphaApproved.output, true);

      // first token should be the deposit token
      const firstWhitelistedToken = await submoloch.approvedTokens(0);
      assert.deepEqual(firstWhitelistedToken.output, depositToken.address);
      assert.deepEqual(firstWhitelistedToken.output, tokenAlpha.address);
    });

    // XXX: We mau not need this check in ink!.
    it.skip('require fail - summoner can not be zero address', async () => {
      const { SubMolochContractFactory, tokenAlpha } = await setup();
      await SubMolochContractFactory.deploy('new',
        zeroAddress,
        [tokenAlpha.address],
        deploymentConfig.PERIOD_DURATION_IN_SECONDS,
        deploymentConfig.VOTING_DURATON_IN_PERIODS,
        deploymentConfig.GRACE_DURATON_IN_PERIODS,
        deploymentConfig.PROPOSAL_DEPOSIT,
        deploymentConfig.DILUTION_BOUND,
        deploymentConfig.PROCESSING_REWARD
        // @ts-ignore
      ).should.be.rejectedWith('Instantiation failed');
    })

    it('require fail - period duration can not be zero', async () => {
      const { summoner, SubMolochContractFactory, tokenAlpha } = await setup();
      await SubMolochContractFactory.deploy('new',
        summoner.address,
        [tokenAlpha.address],
        0,
        deploymentConfig.VOTING_DURATON_IN_PERIODS,
        deploymentConfig.GRACE_DURATON_IN_PERIODS,
        deploymentConfig.PROPOSAL_DEPOSIT,
        deploymentConfig.DILUTION_BOUND,
        deploymentConfig.PROCESSING_REWARD
        // @ts-ignore
      ).should.be.rejectedWith('Instantiation failed');
    })

    it('require fail - voting period can not be zero', async () => {
      const { summoner, SubMolochContractFactory, tokenAlpha } = await setup();
      await SubMolochContractFactory.deploy('new',
        summoner.address,
        [tokenAlpha.address],
        deploymentConfig.PERIOD_DURATION_IN_SECONDS,
        0,
        deploymentConfig.GRACE_DURATON_IN_PERIODS,
        deploymentConfig.PROPOSAL_DEPOSIT,
        deploymentConfig.DILUTION_BOUND,
        deploymentConfig.PROCESSING_REWARD
        // @ts-ignore
      ).should.be.rejectedWith('Instantiation failed');
    })

    it('require fail - voting period exceeds limit', async () => {
      const { summoner, SubMolochContractFactory, tokenAlpha } = await setup();
      await SubMolochContractFactory.deploy('new',
        summoner.address,
        [tokenAlpha.address],
        deploymentConfig.PERIOD_DURATION_IN_SECONDS,
        _1e18Plus1,
        deploymentConfig.GRACE_DURATON_IN_PERIODS,
        deploymentConfig.PROPOSAL_DEPOSIT,
        deploymentConfig.DILUTION_BOUND,
        deploymentConfig.PROCESSING_REWARD
        // @ts-ignore
      ).should.be.rejectedWith('Instantiation failed');

      // still works with 1 less
      const molochTemp = await SubMolochContractFactory.deploy('new',
        summoner.address,
        [tokenAlpha.address],
        deploymentConfig.PERIOD_DURATION_IN_SECONDS,
        _1e18,
        deploymentConfig.GRACE_DURATON_IN_PERIODS,
        deploymentConfig.PROPOSAL_DEPOSIT,
        deploymentConfig.DILUTION_BOUND,
        deploymentConfig.PROCESSING_REWARD
      )

      const totalShares = await molochTemp.totalShares();
      assert.equal(+totalShares.output, summonerShares);
    })

    it('require fail - grace period exceeds limit', async () => {
      const { summoner, SubMolochContractFactory, tokenAlpha } = await setup();
      await SubMolochContractFactory.deploy('new',
        summoner.address,
        [tokenAlpha.address],
        deploymentConfig.PERIOD_DURATION_IN_SECONDS,
        deploymentConfig.VOTING_DURATON_IN_PERIODS,
        _1e18Plus1,
        deploymentConfig.PROPOSAL_DEPOSIT,
        deploymentConfig.DILUTION_BOUND,
        deploymentConfig.PROCESSING_REWARD
        // @FIXME: ).should.be.rejectedWith(revertMessages.molochConstructorGracePeriodLengthExceedsLimit)
        // @ts-ignore
      ).should.be.rejectedWith('Instantiation failed');

      // still works with 1 less
      const molochTemp = await SubMolochContractFactory.deploy('new',
        summoner.address,
        [tokenAlpha.address],
        deploymentConfig.PERIOD_DURATION_IN_SECONDS,
        deploymentConfig.VOTING_DURATON_IN_PERIODS,
        _1e18,
        deploymentConfig.PROPOSAL_DEPOSIT,
        deploymentConfig.DILUTION_BOUND,
        deploymentConfig.PROCESSING_REWARD
      )

      const totalShares = await molochTemp.totalShares();
      assert.equal(+totalShares.output, summonerShares);
    })

    it('require fail - dilution bound can not be zero', async () => {
      const { summoner, SubMolochContractFactory, tokenAlpha } = await setup();
      await SubMolochContractFactory.deploy('new',
        summoner.address,
        [tokenAlpha.address],
        deploymentConfig.PERIOD_DURATION_IN_SECONDS,
        deploymentConfig.VOTING_DURATON_IN_PERIODS,
        deploymentConfig.GRACE_DURATON_IN_PERIODS,
        deploymentConfig.PROPOSAL_DEPOSIT,
        0,
        deploymentConfig.PROCESSING_REWARD
        // @FIXME: ).should.be.rejectedWith(revertMessages.molochConstructorDilutionBoundCannotBe0)
        // @ts-ignore
      ).should.be.rejectedWith('Instantiation failed');
    })

    it('require fail - dilution bound exceeds limit', async () => {
      const { summoner, SubMolochContractFactory, tokenAlpha } = await setup();
      await SubMolochContractFactory.deploy('new',
        summoner.address,
        [tokenAlpha.address],
        deploymentConfig.PERIOD_DURATION_IN_SECONDS,
        deploymentConfig.VOTING_DURATON_IN_PERIODS,
        deploymentConfig.GRACE_DURATON_IN_PERIODS,
        deploymentConfig.PROPOSAL_DEPOSIT,
        _1e18Plus1,
        deploymentConfig.PROCESSING_REWARD
        // @FIXME: ).should.be.rejectedWith(revertMessages.molochConstructorDilutionBoundExceedsLimitExceedsLimit)
        // @ts-ignore
      ).should.be.rejectedWith('Instantiation failed');

      // still works with 1 less
      const molochTemp = await SubMolochContractFactory.deploy('new',
        summoner.address,
        [tokenAlpha.address],
        deploymentConfig.PERIOD_DURATION_IN_SECONDS,
        deploymentConfig.VOTING_DURATON_IN_PERIODS,
        deploymentConfig.GRACE_DURATON_IN_PERIODS,
        deploymentConfig.PROPOSAL_DEPOSIT,
        _1e18,
        deploymentConfig.PROCESSING_REWARD
      );

      const totalShares = await molochTemp.totalShares();
      assert.equal(+totalShares.output, summonerShares);
    })

    it('require fail - need at least one approved token', async () => {
      const { summoner, SubMolochContractFactory, tokenAlpha } = await setup();
      await SubMolochContractFactory.deploy('new',
        summoner.address,
        [],
        deploymentConfig.PERIOD_DURATION_IN_SECONDS,
        deploymentConfig.VOTING_DURATON_IN_PERIODS,
        deploymentConfig.GRACE_DURATON_IN_PERIODS,
        deploymentConfig.PROPOSAL_DEPOSIT,
        deploymentConfig.DILUTION_BOUND,
        deploymentConfig.PROCESSING_REWARD
        // @FIXME: ).should.be.rejectedWith(revertMessages.molochConstructorNeedAtLeastOneApprovedToken)
        // @ts-ignore
      ).should.be.rejectedWith('Instantiation failed');
    })

    it('require fail - too many tokens', async () => {
      const { summoner, SubMolochContractFactory, tokenAlpha } = await setup();
      await SubMolochContractFactory.deploy('new',
        summoner.address,
        await addressArray(MAX_TOKEN_WHITELIST_COUNT.add(new BN(1))),
        deploymentConfig.PERIOD_DURATION_IN_SECONDS,
        deploymentConfig.VOTING_DURATON_IN_PERIODS,
        deploymentConfig.GRACE_DURATON_IN_PERIODS,
        deploymentConfig.PROPOSAL_DEPOSIT,
        deploymentConfig.DILUTION_BOUND,
        deploymentConfig.PROCESSING_REWARD
        // @FIXME: ).should.be.rejectedWith(revertMessages.molochConstructorTooManyTokens)
        // @ts-ignore
      ).should.be.rejectedWith('Instantiation failed');
    })

    it('require fail - deposit cannot be smaller than processing reward', async () => {
      const { summoner, SubMolochContractFactory, tokenAlpha } = await setup();
      await SubMolochContractFactory.deploy('new',
        summoner.address,
        [tokenAlpha.address],
        deploymentConfig.PERIOD_DURATION_IN_SECONDS,
        deploymentConfig.VOTING_DURATON_IN_PERIODS,
        deploymentConfig.GRACE_DURATON_IN_PERIODS,
        _1e18,
        deploymentConfig.DILUTION_BOUND,
        _1e18Plus1
        // @FIXME: ).should.be.rejectedWith(revertMessages.molochConstructorDepositCannotBeSmallerThanProcessingReward)
        // @ts-ignore
      ).should.be.rejectedWith('Instantiation failed');
    })

    // we may not need this check.
    it.skip('require fail - approved token cannot be zero', async () => {
      const { summoner, SubMolochContractFactory, tokenAlpha } = await setup();
      await SubMolochContractFactory.deploy('new',
        summoner.address,
        [zeroAddress],
        deploymentConfig.PERIOD_DURATION_IN_SECONDS,
        deploymentConfig.VOTING_DURATON_IN_PERIODS,
        deploymentConfig.GRACE_DURATON_IN_PERIODS,
        deploymentConfig.PROPOSAL_DEPOSIT,
        deploymentConfig.DILUTION_BOUND,
        deploymentConfig.PROCESSING_REWARD
        // @FIXME: ).should.be.rejectedWith(revertMessages.molochConstructorApprovedTokenCannotBe0)
        // @ts-ignore
      ).should.be.rejectedWith('Instantiation failed');
    })

    it('require fail - duplicate approved token', async () => {
      const { summoner, SubMolochContractFactory, tokenAlpha } = await setup();
      await SubMolochContractFactory.deploy('new',
        summoner.address,
        [tokenAlpha.address, tokenAlpha.address],
        deploymentConfig.PERIOD_DURATION_IN_SECONDS,
        deploymentConfig.VOTING_DURATON_IN_PERIODS,
        deploymentConfig.GRACE_DURATON_IN_PERIODS,
        deploymentConfig.PROPOSAL_DEPOSIT,
        deploymentConfig.DILUTION_BOUND,
        deploymentConfig.PROCESSING_REWARD
        // @FIXME: ).should.be.rejectedWith(revertMessages.molochConstructorDuplicateApprovedToken)
        // @ts-ignore
      ).should.be.rejectedWith('Instantiation failed');

    })
  });

});
