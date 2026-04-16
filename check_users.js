const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('USERS:', users.length);
  if (users.length > 0) {
    console.log('First User ID:', users[0].id);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
