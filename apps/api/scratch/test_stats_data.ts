import { ReferralService } from '../src/services/referral.service';

async function test() {
  const userId = 'cmoj6i54j0000ga1cig443asu';
  const stats = await ReferralService.getStats(userId);
  console.log('Stats for user:', JSON.stringify(stats, null, 2));
}

test().catch(console.error);
