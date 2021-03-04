import BN from 'bn.js';
import { expect } from 'chai';
import { patract, network, artifacts } from 'redspot';

const { getContractFactory, getRandomSigner } = patract;

const { api, getSigners } = network;

const deploymentConfig = {
  'PERIOD_DURATION_IN_SECONDS': 17280,
  'VOTING_DURATON_IN_PERIODS': 35,
  'GRACE_DURATON_IN_PERIODS': 35,
  'PROPOSAL_DEPOSIT': 10,
  'DILUTION_BOUND': 3,
  'PROCESSING_REWARD': 1,
  'TOKEN_SUPPLY': 10000
}

async function setup() {
  const one = new BN(10).pow(new BN(api.registry.chainDecimals[0]));
  const signers = await getSigners();
  const Alice = signers[0];
  const sender = await getRandomSigner(Alice, one.muln(10000));
  const contractFactory = await getContractFactory('submoloch', sender);
  return { sender, contractFactory };
}

describe('Submoloch', () => {

  after(() => {
    return api.disconnect();
  });

  describe('contractor', async () => {
    it('verify deployment parameters', async () => {
      const { sender, contractFactory } = await setup();
      const submoloch = await contractFactory.deploy('new',
        sender.address,
        [1],
        deploymentConfig.PERIOD_DURATION_IN_SECONDS,
        deploymentConfig.VOTING_DURATON_IN_PERIODS,
        deploymentConfig.GRACE_DURATON_IN_PERIODS,
        deploymentConfig.PROPOSAL_DEPOSIT,
        deploymentConfig.DILUTION_BOUND,
        deploymentConfig.PROCESSING_REWARD
      );

      const periodDuration = (await submoloch.query.periodDuration()).output;
      expect(periodDuration).to.eq(17280)

      const totalShares = (await submoloch.query.totalShares()).output;
      expect(totalShares).to.eq(1);

      const totalRoot = (await submoloch.query.totalLoot()).output;
      expect(totalRoot).to.eq(0);
    });
  });

});
