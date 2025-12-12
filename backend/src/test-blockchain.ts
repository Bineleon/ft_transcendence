import { BlockchainService } from './modules/blockchain/blockchain.service.js';
import { getPrismaClient } from './shared/database/prisma.js';

const prisma = getPrismaClient();
const blockchainService = new BlockchainService();

async function testBlockchain() {
  console.log('🧪 Test du module blockchain\n');

  try {
    // 1. Créer un tournoi de test
    console.log('📝 Création d\'un tournoi de test...');
    const tournament = await prisma.tournament.create({
      data: {
        code: 'TEST123',
        name: 'Tournoi Test Blockchain',
        mode: 'CLASSIC',
        status: 'RUNNING',
        maxParticipants: 4
      }
    });
    console.log('✅ Tournoi créé:', tournament.code);

    // 2. Créer 4 joueurs de test
    console.log('\n👥 Création de 4 joueurs...');
    const players = await Promise.all([
      prisma.user.upsert({
        where: { username: 'alice' },
        create: { 
          username: 'alice', 
          email: 'alice@test.com',
          passwordHash: 'hash'
        },
        update: {}
      }),
      prisma.user.upsert({
        where: { username: 'bob' },
        create: { 
          username: 'bob', 
          email: 'bob@test.com',
          passwordHash: 'hash'
        },
        update: {}
      }),
      prisma.user.upsert({
        where: { username: 'charlie' },
        create: { 
          username: 'charlie', 
          email: 'charlie@test.com',
          passwordHash: 'hash'
        },
        update: {}
      }),
      prisma.user.upsert({
        where: { username: 'david' },
        create: { 
          username: 'david', 
          email: 'david@test.com',
          passwordHash: 'hash'
        },
        update: {}
      })
    ]);
    console.log('✅ 4 joueurs créés');

    // 3. Ajouter les participants au tournoi
    await prisma.tournament.update({
      where: { id: tournament.id },
      data: {
        participants: {
          connect: players.map(p => ({ id: p.id }))
        }
      }
    });

    // 4. Créer 3 matchs (structure classique de tournoi à 4)
    // Round 1 : Alice vs Bob, Charlie vs David
    // Round 2 : Alice vs Charlie (finale)
    console.log('\n🎮 Création de 3 matchs (demi-finales + finale)...');
    
    // Demi-finale 1 : Alice bat Bob
    const match1 = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        round: 1,
        gameIndex: 0,
        p1UserId: players[0].id, // alice
        p2UserId: players[1].id, // bob
        p1Score: 11,
        p2Score: 7,
        winnerUserId: players[0].id,
        status: 'CLOSED',
        closedAt: new Date()
      }
    });

    // Demi-finale 2 : Charlie bat David
    const match2 = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        round: 1,
        gameIndex: 1,
        p1UserId: players[2].id, // charlie
        p2UserId: players[3].id, // david
        p1Score: 11,
        p2Score: 8,
        winnerUserId: players[2].id,
        status: 'CLOSED',
        closedAt: new Date()
      }
    });

    // Finale : Alice bat Charlie
    const match3 = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        round: 2,
        gameIndex: 0,
        p1UserId: players[0].id, // alice
        p2UserId: players[2].id, // charlie
        p1Score: 11,
        p2Score: 9,
        winnerUserId: players[0].id,
        status: 'CLOSED',
        closedAt: new Date()
      }
    });
    console.log('✅ 3 matchs créés et terminés');
    console.log('   Demi-finale 1: Alice 11-7 Bob');
    console.log('   Demi-finale 2: Charlie 11-8 David');
    console.log('   Finale: Alice 11-9 Charlie');
    console.log('   🏆 Gagnant: Alice (2 victoires)');

    // 5. Préparer les données pour la blockchain
    console.log('\n⛓️  Préparation des données blockchain...');
    const blockchainData = {
      tournamentId: parseInt(tournament.id.replace(/\D/g, '').slice(0, 10)),
      winner: 'alice', // Alice a gagné 2 matchs sur 2
      players: ['alice', 'bob', 'charlie', 'david'],
      matches: [
        {
          matchId: parseInt(match1.id.replace(/\D/g, '').slice(0, 10)),
          player1: 'alice',
          player2: 'bob',
          scorePlayer1: 11,
          scorePlayer2: 7,
          winner: 'alice',
          timestamp: Math.floor(new Date().getTime() / 1000)
        },
        {
          matchId: parseInt(match2.id.replace(/\D/g, '').slice(0, 10)),
          player1: 'charlie',
          player2: 'david',
          scorePlayer1: 11,
          scorePlayer2: 8,
          winner: 'charlie',
          timestamp: Math.floor(new Date().getTime() / 1000)
        },
        {
          matchId: parseInt(match3.id.replace(/\D/g, '').slice(0, 10)),
          player1: 'alice',
          player2: 'charlie',
          scorePlayer1: 11,
          scorePlayer2: 9,
          winner: 'alice',
          timestamp: Math.floor(new Date().getTime() / 1000)
        }
      ]
    };

    console.log('Données à envoyer:', JSON.stringify(blockchainData, null, 2));

    // 6. Envoyer sur la blockchain
    console.log('\n📤 Envoi sur la blockchain Avalanche...');
    const txHash = await blockchainService.recordTournament(
      blockchainData.tournamentId,
      blockchainData.winner,
      blockchainData.players,
      blockchainData.matches
    );

    console.log('\n✅ SUCCÈS !');
    console.log('Transaction hash:', txHash);
    console.log('Explorer:', blockchainService.getExplorerUrl(txHash));

    // 7. Mettre à jour le tournoi avec le txHash
    await prisma.tournament.update({
      where: { id: tournament.id },
      data: {
        status: 'CLOSED',
        txHash,
        onchainAt: new Date()
      }
    });

    console.log('\n✅ Tournoi mis à jour dans la DB avec le txHash');
    console.log('\n🎉 TEST RÉUSSI !');
    console.log('\n📊 Résumé:');
    console.log(`   - 4 joueurs: alice, bob, charlie, david`);
    console.log(`   - 3 matchs enregistrés`);
    console.log(`   - Gagnant: alice`);
    console.log(`   - Transaction: ${txHash}`);

  } catch (error) {
    console.error('\n❌ ERREUR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Lancer le test
testBlockchain();