import { PrismaClient } from '../src/generated/prisma';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Define test users with different roles
  const testUsers = [
    {
      role: 'admin',
      name: 'admin',
      email: 'admin@diamond.local',
      image: 'https://avatars.githubusercontent.com/u/1?v=4',
    },
    {
      role: 'user',
      name: 'user',
      email: 'user@diamond.local',
      image: 'https://avatars.githubusercontent.com/u/2?v=4',
    },
    {
      role: 'tester',
      name: 'tester',
      email: 'tester@diamond.local',
      image: 'https://avatars.githubusercontent.com/u/3?v=4',
    },
    {
      role: 'player1',
      name: 'player1',
      email: 'player1@diamond.local',
      image: 'https://avatars.githubusercontent.com/u/4?v=4',
    },
    {
      role: 'player2',
      name: 'player2',
      email: 'player2@diamond.local',
      image: 'https://avatars.githubusercontent.com/u/5?v=4',
    },
  ];

  // Create users with accounts and sessions
  for (const userData of testUsers) {
    console.log(`Creating ${userData.role} user...`);

    // Create or update user
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        image: userData.image,
        emailVerified: new Date(),
      },
      create: {
        name: userData.name,
        email: userData.email,
        image: userData.image,
        emailVerified: new Date(),
        discordId: `discord_${userData.role}_${Date.now()}`,
      },
    });

    // Create OAuth account for the user
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'discord',
          providerAccountId: `discord_${userData.role}_${Date.now()}`,
        },
      },
      update: {},
      create: {
        userId: user.id,
        type: 'oauth',
        provider: 'discord',
        providerAccountId: `discord_${userData.role}_${Date.now()}`,
        access_token: `access_token_${userData.role}_${randomUUID()}`,
        token_type: 'Bearer',
        scope: 'identify email',
      },
    });

    // Create a long-lived session for the user (expires in 30 days)
    const sessionExpiry = new Date();
    sessionExpiry.setDate(sessionExpiry.getDate() + 30);

    await prisma.session.upsert({
      where: {
        sessionToken: `session_${userData.role}_${randomUUID()}`,
      },
      update: {
        expires: sessionExpiry,
      },
      create: {
        userId: user.id,
        sessionToken: `session_${userData.role}_${randomUUID()}`,
        expires: sessionExpiry,
      },
    });

    console.log(`✅ ${userData.role} user created with valid session`);
  }

  // Create some sample matches for testing
  console.log('Creating sample matches...');

  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@diamond.local' },
  });
  const player1User = await prisma.user.findUnique({
    where: { email: 'player1@diamond.local' },
  });
  const player2User = await prisma.user.findUnique({
    where: { email: 'player2@diamond.local' },
  });

  if (adminUser && player1User && player2User) {
    // Create a waiting match
    await prisma.match.upsert({
      where: { id: 'test-waiting-match' },
      update: {},
      create: {
        id: 'test-waiting-match',
        status: 'WAITING_FOR_PLAYER',
        player1Id: adminUser.id,
      },
    });

    // Create an in-progress match with a game
    const inProgressMatch = await prisma.match.upsert({
      where: { id: 'test-in-progress-match' },
      update: {},
      create: {
        id: 'test-in-progress-match',
        status: 'IN_PROGRESS',
        player1Id: player1User.id,
        player2Id: player2User.id,
      },
    });

    // Create a game for the in-progress match
    await prisma.game.upsert({
      where: {
        matchId_gameNumber: {
          matchId: inProgressMatch.id,
          gameNumber: 1,
        },
      },
      update: {},
      create: {
        matchId: inProgressMatch.id,
        gameNumber: 1,
        status: 'IN_PROGRESS',
        whitePlayerId: player1User.id,
        blackPlayerId: player2User.id,
        board: {
          pieces: [],
          lastMove: null,
        },
        moveHistory: [],
      },
    });

    console.log('✅ Sample matches created');
  }

  console.log('🎉 Database seeding completed!');
  console.log('');
  console.log('🔐 Test Authentication URLs:');
  console.log('  Admin:   http://localhost:3000/api/token?role=admin');
  console.log('  User:    http://localhost:3000/api/token?role=user');
  console.log('  Tester:  http://localhost:3000/api/token?role=tester');
  console.log('  Player1: http://localhost:3000/api/token?role=player1');
  console.log('  Player2: http://localhost:3000/api/token?role=player2');
  console.log('');
  console.log('💡 Add &redirect=/path to redirect after authentication');
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
