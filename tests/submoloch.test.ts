import BN from 'bn.js';
import * as chai from 'chai';
import { expect } from 'chai';
const { assert } = chai;

import { patract, network } from 'redspot';
import {
  verifyBalance,
  verifyInternalBalance,
  verifyInternalBalances,
  verifyAllowance,
  verifyProposal,
  verifyFlags,
  verifyBalances,
  verifySubmitVote,
  verifyProcessProposal,
  verifyMember
} from './test-utils';

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
  rageQuitufficientShares: 'insufficient shares',
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
const GUILD = '13C2q9xLsW4xTeQCcp3fr44vBEcVQx7sERzKb9iENWDk5FZM'
const ESCROW = '12KzhL2G5oWLyeFciHKowDgedsLtqXhTzR2Njx4Ksb5DWjkA';
const TOTAL = '14KRrGnAj13EZkWu72PtGbupXcTF37eyZUJJ4TS1sEr1J3Dh';
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
  const applicant1 = await getRandomSigner(creator, one.muln(100));
  const applicant2 = await getRandomSigner(creator, one.muln(100));
  const TokenContractFactory = await getContractFactory('erc20', creator);
  const tokenAlpha = await TokenContractFactory.deploy('new', deploymentConfig.TOKEN_SUPPLY);
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
  return { creator, summoner, applicant1, applicant2, tokenAlpha, submoloch, SubMolochContractFactory, TokenContractFactory };
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
    'ProposalIndex': 'u128',
    'Proposal': {
      'applicant': 'Option<AccountId>',
      'proposer': 'AccountId',
      'sponsor': 'Option<AccountId>',
      'sharesRequested': 'u128',
      'lootRequested': 'u128',
      'tributeOffered': 'Option<u128>',
      'tributeToken': 'Option<AccountId>',
      'paymentRequested': 'Option<u128>',
      'paymentToken': 'Option<AccountId>',
      'startingPeriod': 'u128',
      'yesVotes': 'u128',
      'noVotes': 'u128',
      'flags': '[bool; 6]',
      'details': '[u8; 32]',
      'maxTotalSharesAndLootAtYesVote': 'u128'
    },
    'Member': {
      'delegateKey': 'AccountId',
      'shares': 'u128',
      'loot': 'u128',
      'exists': 'bool',
      'highestIndexYesVote': 'u128',
      'jailed': 'ProposalId',
    }
  });

  const fundAndApproveToMoloch = async (token, moloch, { to, from, value }) => {
    await token.transfer(to, value, { from: from });
    await token.approve(moloch.address, value, { from: to });
  }

  after(() => {
    return api.disconnect();
  });

  describe('contractor', async () => {

    it('verify deployment parameters', async () => {
      const { creator, summoner, tokenAlpha, submoloch } = await setup();
      const depositToken = tokenAlpha;

      // transfer initial funds.
      await tokenAlpha.tx['transfer'](summoner.address, initSummonerBalance, { from: creator.address });

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
      const tokenSupply = (await tokenAlpha['totalSupply']()).output;
      assert.equal(tokenSupply, deploymentConfig.TOKEN_SUPPLY)
      const summonerBalance = (await tokenAlpha['balanceOf'](summoner.address)).output;
      assert.equal(summonerBalance, initSummonerBalance)
      const creatorBalance = (await tokenAlpha['balanceOf'](creator.address)).output;
      assert.equal(creatorBalance, deploymentConfig.TOKEN_SUPPLY - initSummonerBalance)

      // check all tokens passed in construction are approved
      const tokenAlphaApproved = await submoloch.tokenWhitelist(tokenAlpha.address);
      assert.equal(tokenAlphaApproved.output, true);

      // first token should be the deposit token
      const firstWhitelistedToken = await submoloch.approvedTokens(0);
      assert.deepEqual(firstWhitelistedToken.output, depositToken.address);
      assert.deepEqual(firstWhitelistedToken.output, tokenAlpha.address);
    });

    it('require fail - summoner can not be zero address', async () => {
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
    it('require fail - approved token cannot be zero', async () => {
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

  describe('submit proposal', async () => {
    let tokenAlpha, moloch;
    let summoner;
    let proposal1;

    beforeEach(async () => {
      const prepared = await setup();
      tokenAlpha = prepared.tokenAlpha;
      moloch = prepared.submoloch;
      summoner = prepared.summoner;

      proposal1 = {
        applicant: prepared.applicant1,
        sharesRequested: standardShareRequest,
        lootRequested: standardLootRequest,
        tributeOffered: standardTribute,
        tributeToken: tokenAlpha,
        paymentRequested: 0,
        paymentToken: tokenAlpha,
        details: 'all hail moloch'
      };

      await fundAndApproveToMoloch(tokenAlpha, moloch, {
        to: prepared.applicant1.address,
        from: prepared.creator.address,
        value: proposal1.tributeOffered
      })
    });

    it('happy case', async () => {
      const countBefore: BN = (await moloch.proposalCount()).output;

      await verifyBalance({
        token: tokenAlpha,
        address: proposal1.applicant.address,
        expectedBalance: proposal1.tributeOffered
      });

      // grant the permission.
      await tokenAlpha.approve(moloch.address, proposal1.tributeOffered, {
        signer: proposal1.applicant
      });

      const proposer = proposal1.applicant;

      await moloch.submitProposal(
        proposal1.applicant.address,
        proposal1.sharesRequested,
        proposal1.lootRequested,
        proposal1.tributeOffered,
        proposal1.tributeToken.address,
        proposal1.paymentRequested,
        proposal1.paymentToken.address,
        proposal1.details,
        { signer: proposal1.applicant }
      );

      const countAfter = (await moloch.query.proposalCount()).output;
      assert.equal(countAfter.toNumber(), countBefore.add(_1).toNumber());

      await verifyProposal({
        moloch: moloch,
        proposal: proposal1,
        proposalId: firstProposalIndex,
        proposer: proposer.address,
        expectedProposalCount: 1
      })

      await verifyFlags({
        moloch: moloch,
        proposalId: firstProposalIndex,
        expectedFlags: [false, false, false, false, false, false]
      })

      // tribute been moved to the DAO
      await verifyBalance({
        token: tokenAlpha,
        address: proposal1.applicant.address,
        expectedBalance: 0
      })

      // DAO is holding the tribute
      await verifyBalance({
        token: tokenAlpha,
        address: moloch.address,
        expectedBalance: proposal1.tributeOffered
      })

      // ESCROW balance has been updated
      await verifyInternalBalance({
        moloch: moloch,
        token: tokenAlpha,
        user: ESCROW,
        expectedBalance: proposal1.tributeOffered
      })
    })

    it('require fail - insufficient tribute tokens', async () => {
      // grant the permission.
      await tokenAlpha.approve(moloch.address, proposal1.tributeOffered, {
        signer: proposal1.applicant
      });

      await tokenAlpha.decreaseAllowance(moloch.address, 1, { signer: proposal1.applicant });

      // SafeMath reverts in ERC20.transferFrom
      await expect(moloch.submitProposal(
        proposal1.applicant.address,
        proposal1.sharesRequested,
        proposal1.lootRequested,
        proposal1.tributeOffered,
        proposal1.tributeToken.address,
        proposal1.paymentRequested,
        proposal1.paymentToken.address,
        proposal1.details,
        { signer: proposal1.applicant }
      )).not.emit(moloch, "SubmitProposal");
    })

    it('require fail - tribute token is not whitelisted', async () => {
      await tokenAlpha.approve(moloch.address, proposal1.tributeOffered, {
        signer: proposal1.applicant
      });
      // use ESCROW address as a fake token address.
      proposal1.tributeToken = ESCROW;

      await expect(moloch.submitProposal(
        proposal1.applicant.address,
        proposal1.sharesRequested,
        proposal1.lootRequested,
        proposal1.tributeOffered,
        proposal1.tributeToken.address,
        proposal1.paymentRequested,
        proposal1.paymentToken.address,
        proposal1.details,
        { from: proposal1.applicant }
      )).to.not.emit(moloch, "SubmitProposal");
    });

    it('require fail - applicant can not be zero', async () => {
      await expect(moloch.submitProposal(
        null,
        proposal1.sharesRequested,
        proposal1.lootRequested,
        proposal1.tributeOffered,
        proposal1.tributeToken.address,
        proposal1.paymentRequested,
        proposal1.paymentToken.address,
        proposal1.details,
        { signer: proposal1.applicant }
      )).to.not.emit(moloch, "SubmitProposal");
    })

    it('require fail - applicant address can not be reserved', async () => {
      await expect(moloch.submitProposal(
        GUILD,
        proposal1.sharesRequested,
        proposal1.lootRequested,
        proposal1.tributeOffered,
        proposal1.tributeToken.address,
        proposal1.paymentRequested,
        proposal1.paymentToken.address,
        proposal1.details,
        { signer: proposal1.applicant }
      )).to.not.emit(moloch, "SubmitProposal");

      await expect(moloch.submitProposal(
        ESCROW,
        proposal1.sharesRequested,
        proposal1.lootRequested,
        proposal1.tributeOffered,
        proposal1.tributeToken.address,
        proposal1.paymentRequested,
        proposal1.paymentToken.address,
        proposal1.details,
        { signer: proposal1.applicant }
      )).not.emit(moloch, "SubmitProposal");

      await expect(moloch.submitProposal(
        TOTAL,
        proposal1.sharesRequested,
        proposal1.lootRequested,
        proposal1.tributeOffered,
        proposal1.tributeToken.address,
        proposal1.paymentRequested,
        proposal1.paymentToken.address,
        proposal1.details,
        { signer: proposal1.applicant }
      )).to.not.emit(moloch, "SubmitProposal");
    })

    it('require fail - applicant address can not be reserved', async () => {
      await expect(moloch.submitProposal(
        GUILD,
        proposal1.sharesRequested,
        proposal1.lootRequested,
        proposal1.tributeOffered,
        proposal1.tributeToken.address,
        proposal1.paymentRequested,
        proposal1.paymentToken.address,
        proposal1.details,
        { signer: proposal1.applicant }
      )).to.not.emit(moloch, "SubmitProposal");

      await expect(moloch.submitProposal(
        ESCROW,
        proposal1.sharesRequested,
        proposal1.lootRequested,
        proposal1.tributeOffered,
        proposal1.tributeToken.address,
        proposal1.paymentRequested,
        proposal1.paymentToken.address,
        proposal1.details,
        { signer: proposal1.applicant }
      )).to.not.emit(moloch, "SubmitProposal");

      await expect(moloch.submitProposal(
        TOTAL,
        proposal1.sharesRequested,
        proposal1.lootRequested,
        proposal1.tributeOffered,
        proposal1.tributeToken.address,
        proposal1.paymentRequested,
        proposal1.paymentToken.address,
        proposal1.details,
        { signer: proposal1.applicant }
      )).to.not.emit(moloch, "SubmitProposal");
    })

    it('failure - too many shares requested', async () => {
      await expect(moloch.submitProposal(
        proposal1.applicant.address,
        _1e18Plus1, // MAX_NUMBER_OF_SHARES_AND_LOOT
        0, // skip loot
        0, // skip tribute
        proposal1.tributeToken.address,
        proposal1.paymentRequested,
        proposal1.paymentToken.address,
        proposal1.details,
        { signer: proposal1.applicant }
      )).to.not.emit(moloch, "SubmitProposal");

      const proposalCount = await moloch.proposalCount();
      expect(proposalCount.output).eq(0);

      // should work with one less
      await moloch.submitProposal(
        proposal1.applicant.address,
        _1e18, // MAX_NUMBER_OF_SHARES_AND_LOOT - 1
        0, // skip loot
        0, // skip tribute
        proposal1.tributeToken.address,
        proposal1.paymentRequested,
        proposal1.paymentToken.address,
        proposal1.details,
        { signer: proposal1.applicant }
      )

      const proposalCountAfter = await moloch.proposalCount()
      expect(proposalCountAfter.output).to.eq(1);
    })

    it('failure - too many shares (just loot) requested', async () => {
      await expect(moloch.submitProposal(
        proposal1.applicant.address,
        0, // skip shares
        _1e18Plus1, // MAX_NUMBER_OF_SHARES_AND_LOOT
        0, // skip tribute
        proposal1.tributeToken.address,
        proposal1.paymentRequested,
        proposal1.paymentToken.address,
        proposal1.details,
        { signer: proposal1.applicant }
      )).to.not.emit(moloch, "SubmitProposal");

      const proposalCount = await moloch.proposalCount();
      expect(proposalCount.output.toNumber()).to.eq(0);

      // should work with one less
      await moloch.submitProposal(
        proposal1.applicant.address,
        0, // skip shares
        _1e18, // MAX_NUMBER_OF_SHARES_AND_LOOT - 1
        0, // skip tribute
        proposal1.tributeToken.address,
        proposal1.paymentRequested,
        proposal1.paymentToken.address,
        proposal1.details,
        { signer: proposal1.applicant }
      )

      const proposalCountAfter = await moloch.proposalCount();
      expect(proposalCountAfter.output.toNumber()).to.eq(1);
    })

    it('failure - too many shares (& loot) requested', async () => {
      await expect(moloch.submitProposal(
        proposal1.applicant.address,
        _1e18Plus1.sub(new BN('10')), // MAX_NUMBER_OF_SHARES_AND_LOOT - 10
        10, // 10 loot
        0, // skip tribute
        proposal1.tributeToken.address,
        proposal1.paymentRequested,
        proposal1.paymentToken.address,
        proposal1.details,
        { signer: proposal1.applicant }
      )).not.emit(moloch, "SubmitProposal");

      const proposalCount = await moloch.proposalCount();
      expect(proposalCount.output.toNumber()).to.eq(0);

      // should work with one less
      await moloch.submitProposal(
        proposal1.applicant.address,
        _1e18.sub(new BN('10')), // MAX_NUMBER_OF_SHARES_AND_LOOT - 10
        10, // 10 loot
        0, // skip tribute
        proposal1.tributeToken.address,
        proposal1.paymentRequested,
        proposal1.paymentToken.address,
        proposal1.details,
        { signer: proposal1.applicant }
      )

      const proposalCountAfter = await moloch.proposalCount();
      expect(proposalCountAfter.output.toNumber()).to.eq(1);
    })

    it('happy case - second submitted proposal returns incremented proposalId', async () => {
     const result1 = await moloch.submitProposal(
          proposal1.applicant.address,
          proposal1.sharesRequested,
          proposal1.lootRequested,
          0, // skip tribute
          proposal1.tributeToken.address,
          proposal1.paymentRequested,
          proposal1.paymentToken.address,
          proposal1.details,
          { signer : summoner }
      );
     const event = result1.events[1];
     expect(event.args[9]).eq(0);

      const result2= await moloch.submitProposal(
          proposal1.applicant.address,
          proposal1.sharesRequested,
          proposal1.lootRequested,
          0, // skip tribute
          proposal1.tributeToken.address,
          proposal1.paymentRequested,
          proposal1.paymentToken.address,
          proposal1.details,
          { signer: summoner }
      );

      // @FIXME: Why the events has both SummonComplete, and SubmitProposal?
      // I expect we either have 1 event or 3 events here.
      const event2 = result2.events[1];
      expect(event2.args[9]).eq(1);
    })
  });

  describe('submitWhitelistProposal', () => {
    let newToken, tokenAlpha, moloch;
    let TokenContractFactory;
    let summoner;
    let proposal1;

    beforeEach(async () => {
      const prepared = await setup();
      newToken = await prepared.TokenContractFactory.deploy('new', deploymentConfig.TOKEN_SUPPLY);
      moloch = prepared.submoloch;
      tokenAlpha = prepared.tokenAlpha;
      summoner = prepared.summoner;
      TokenContractFactory = prepared.TokenContractFactory;

      proposal1 = {
        applicant: prepared.applicant1,
        sharesRequested: standardShareRequest,
        lootRequested: standardLootRequest,
        tributeOffered: standardTribute,
        tributeToken: newToken,
        paymentRequested: 0,
        paymentToken: newToken,
        details: 'all hail moloch'
      };
    });

    it('happy case', async () => {
      const proposer = proposal1.applicant.address;
      const whitelistProposal = {
        applicant: null,
        proposer: proposal1.applicant.address,
        sharesRequested: 0,
        tributeOffered: 0,
        tributeToken: newToken,
        paymentRequested: 0,
        paymentToken: null,
        details: 'whitelist me!'
      }

      // no tribute value is required
      await verifyBalance({
        token: newToken,
        address: proposal1.applicant.address,
        expectedBalance: 0
      })

      await moloch.submitWhitelistProposal(
        newToken.address,
        'whitelist me!',
        { signer: proposal1.applicant }
      )

      await verifyProposal({
        moloch: moloch,
        proposal: whitelistProposal,
        proposalId: firstProposalIndex,
        proposer: proposer,
        expectedProposalCount: 1
      })

      await verifyFlags({
        moloch: moloch,
        proposalId: firstProposalIndex,
        expectedFlags: [false, false, false, false, true, false] // whitelist flag set to true after proposal
      })

      // no tribute value is required
      await verifyBalance({
        token: newToken,
        address: proposal1.applicant.address,
        expectedBalance: 0
      })

      // no tribute value is required so moloch will be empty
      await verifyBalance({
        token: newToken,
        address: moloch.address,
        expectedBalance: 0
      })
    });

    it('require fail - applicant can not be zero', async () => {
      await expect(moloch.submitWhitelistProposal(
        zeroAddress,
        'whitelist me!',
        { signer: proposal1.applicant }
      )).to.not.emit(moloch, "SubmitProposal");
    });

    it('require fail - cannot add already have whitelisted the token', async () => {
      await expect(moloch.submitWhitelistProposal(
        tokenAlpha.address,
        'whitelist me!',
        { signer: proposal1.applicant }
      )).to.not.emit(moloch, "SubmitProposal");
    });

    it('happy case - second submitted proposal returns incremented proposalId', async () => {
      const result1 = await moloch.submitWhitelistProposal(
          newToken.address,
          'whitelist me!',
          { signer: summoner }
      );
      const proposalId1 = result1.events[0].args[9];
      expect(proposalId1).to.eq(0);

      const tokenBeta = await TokenContractFactory.deploy('new', deploymentConfig.TOKEN_SUPPLY);

      const result2 = await moloch.submitWhitelistProposal(
          tokenBeta.address,
          'whitelist me!',
          { signer: summoner }
      )

      const proposalId2 = result2.events[0].args[9];
      expect(proposalId2).to.eq(1);
    })
  });

});
