const zeroAddress = '0x0000000000000000000000000000000000000000'

import * as chai from 'chai';
const { assert } = chai

export const verifyBalance = async ({ token, address, expectedBalance }) => {
  const balance = (await token.balanceOf(address)).output;
  assert.equal(balance.toString(), expectedBalance.toString(), `token balance incorrect for ${token.address} with ${address}`)
}

export const verifyInternalBalance = async ({ moloch, token, user, expectedBalance }) => {
  const balance = (await moloch.userTokenBalances(user, token.address)).output;
  assert.equal(balance.toString(), expectedBalance.toString(), `internal token balance incorrect for user ${user} and token ${token.address}`)
}

export const verifyInternalBalances = async ({ moloch, token, userBalances }) => {
  const users = Object.keys(userBalances)
  for (let i = 0; i < users.length; i++) {
    await verifyInternalBalance({ moloch, token, user: users[i], expectedBalance: userBalances[users[i]]})
  }
}

export const verifyAllowance = async ({ token, owner, spender, expectedAllowance }) => {
  const allowance = (await token.allowance(owner, spender)).output;
  assert.equal(+allowance, expectedAllowance, `allowance incorrect for ${token.address} owner ${owner} spender ${spender}`)
}

export const verifyProposal = async (
  {
    moloch,
    proposal,
    proposalId,
    proposer,
    sponsor = null,
    expectedStartingPeriod = 0,
    expectedProposalCount = 0,
    expectedProposalQueueLength = 0
  }
) => {
  const proposalData = (await moloch.proposals(proposalId)).output.toHuman();

  const proposalCount = (await moloch.query.proposalCount()).output;
  assert.equal(proposalCount.toNumber(), expectedProposalCount);

  const proposalQueueLength = (await moloch.getProposalQueueLength()).output;
  assert.equal(proposalQueueLength.toNumber(), expectedProposalQueueLength);
  if (!proposalData.flags[4] && !proposalData.flags[5]) {
    assert.equal(proposalData.applicant, proposal.applicant.address);
  }
  assert.equal(proposalData.proposer, proposer, 'proposers does not match');
  assert.equal(proposalData.sponsor, sponsor, 'sponsor does not match');
  assert.equal(proposalData.sharesRequested, proposal.sharesRequested, 'sharesRequested does not match');
  
  assert.equal(proposalData.tributeOffered.toString(), proposal.tributeOffered.toString(), 'tributeOffered does not match');
  assert.equal(proposalData.tributeToken, proposal.tributeToken.address, 'tributeToken does not match');

  if (!proposalData.flags[4] && !proposalData.flags[5]) {
    assert.equal(proposalData.paymentRequested, proposal.paymentRequested, 'paymentRequested does not match');
    assert.equal(proposalData.paymentToken, proposal.paymentToken.address, 'paymentToken does not match');
  }
  assert.equal(+proposalData.startingPeriod, expectedStartingPeriod, 'startingPeriod does not match');
  assert.equal(proposalData.yesVotes, 0, 'yesVotes does not match');
  assert.equal(proposalData.noVotes, 0, 'noVotes does not match');
//@FIXME: string encodin/decodeing.
//  assert.equal(proposalData.details, proposal.details, 'details does not match');
  assert.equal(proposalData.maxTotalSharesAndLootAtYesVote, 0, 'maxTotalSharesAndLootAtYesVote invalid');
}

export const verifyFlags = async ({ moloch, proposalId, expectedFlags }) => {
  const actualFlags = (await moloch.getProposalFlags(proposalId)).output.unwrap();

  // [sponsored, processed, didPass, cancelled, whitelist, guildkick]
  assert.equal(actualFlags[0], expectedFlags[0], 'sponsored flag incorrect');
  assert.equal(actualFlags[1], expectedFlags[1], 'processed flag incorrect');
  assert.equal(actualFlags[2], expectedFlags[2], 'didPass flag incorrect');
  assert.equal(actualFlags[3], expectedFlags[3], 'cancelled flag incorrect');
  assert.equal(actualFlags[4], expectedFlags[4], 'whitelist flag incorrect');
  assert.equal(actualFlags[5], expectedFlags[5], 'guildkick flag incorrect');
}

export const verifyBalances = async (
  {
    token,
    moloch, // FIXME rename as slightly misleading
    expectedMolochBalance,
    applicant,
    expectedApplicantBalance
  }
) => {
  const molochBalance = (await token.balanceOf(moloch)).output;

  assert.equal(molochBalance.toString(), expectedMolochBalance.toString(), `moloch token balance incorrect for ${token.address} with ${moloch}`)

  const applicantBalance = (await token.balanceOf(applicant)).output;
  assert.equal(applicantBalance.toString(), expectedApplicantBalance.toString(), `Applicant token balance incorrect for ${token.address} with ${applicant}`)
}

export const verifySubmitVote = async (
  {
    moloch,
    proposalIndex,
    memberAddress,
    expectedVote,
    expectedMaxSharesAndLootAtYesVote = 0,
    initialYesVotes = 0,
    initialNoVotes = 0
  }
) => {
  const proposalId = (await moloch.proposalQueue(proposalIndex)).output;
  const proposalData = (await moloch.proposals(proposalId)).output;

  assert.equal(+proposalData.yesVotes, initialYesVotes + (expectedVote === 1 ? 1 : 0));
  assert.equal(+proposalData.noVotes, initialNoVotes + (expectedVote === 1 ? 0 : 1));
  assert.equal(+proposalData.maxTotalSharesAndLootAtYesVote, expectedMaxSharesAndLootAtYesVote);

  const memberVote = (await moloch.getMemberProposalVote(memberAddress, proposalIndex)).output;
  assert.equal(+memberVote, expectedVote);
}

export const verifyProcessProposal = async (
  {
    moloch,
    proposalIndex,
    expectedYesVotes = 0,
    expectedNoVotes = 0,
    expectedTotalShares = 0,
    expectedTotalLoot = 0,
    expectedMaxSharesAndLootAtYesVote = 0
  }
) => {
  // flags and proposal data
  const proposalId = (await moloch.proposalQueue(proposalIndex)).output;
  const proposalData = (await moloch.proposals(proposalId)).output;

  assert.equal(+proposalData.yesVotes, expectedYesVotes, 'proposal yes votes incorrect');
  assert.equal(+proposalData.noVotes, expectedNoVotes, 'proposal no votes incorrect');
  assert.equal(+proposalData.maxTotalSharesAndLootAtYesVote, expectedMaxSharesAndLootAtYesVote, 'total shares at yes vote incorrect');

  const totalShares = (await moloch.totalShares()).output;
  assert.equal(+totalShares, expectedTotalShares, 'total shares incorrect');

  const totalLoot = (await moloch.totalLoot()).output;
  assert.equal(+totalLoot, expectedTotalLoot, 'total loot incorrect');
}

export const verifyMember = async (
  {
    moloch,
    member,
    expectedDelegateKey = zeroAddress,
    expectedShares = 0,
    expectedLoot = 0,
    expectedExists = true,
    expectedJailed = 0,
    expectedHighestIndexYesVote = 0,
    expectedMemberAddressByDelegateKey = zeroAddress
  }
) => {
  const memberData = (await moloch.members(member)).output;
  assert.equal(memberData.delegateKey, expectedDelegateKey, 'delegate key incorrect');
  assert.equal(+memberData.shares, expectedShares, 'expected shares incorrect');
  assert.equal(+memberData.loot, expectedLoot, 'expected loot incorrect');
  assert.equal(memberData.exists, expectedExists, 'exists incorrect');
  assert.equal(+memberData.jailed, expectedJailed, 'jailed incorrect');
  assert.equal(+memberData.highestIndexYesVote, expectedHighestIndexYesVote, 'highest index yes vote incorrect');

  const newMemberAddressByDelegateKey = (await moloch.memberAddressByDelegateKey(expectedDelegateKey)).output;
  assert.equal(newMemberAddressByDelegateKey, expectedMemberAddressByDelegateKey, 'member address by delegate key incorrect');
}