module.exports = {
  async up(db, client) {
    // TODO write your migration here.
    // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: true}});

    await db.collection('artifacts').insertMany([
      {
        id: 1,
        logoUrl: 'https://cdn.devtonchemy.ru/images/Water.png',
        name: 'Water',
        createdAt: new Date(),
        updatedAt: new Date(),
        level: 1,
      },
      {
        id: 2,
        logoUrl: 'https://cdn.devtonchemy.ru/images/Air.png',
        name: 'Air',
        createdAt: new Date(),
        updatedAt: new Date(),
        level: 1,
      },
      {
        id: 3,
        logoUrl: 'https://cdn.devtonchemy.ru/images/Fire.png',
        name: 'Fire',
        createdAt: new Date(),
        updatedAt: new Date(),
        level: 1,
      },
      {
        id: 4,
        logoUrl: 'https://cdn.devtonchemy.ru/images/Earth.png',
        name: 'Earth',
        createdAt: new Date(),
        updatedAt: new Date(),
        level: 1,
      },
      {
        id: 5,
        logoUrl: 'https://cdn.devtonchemy.ru/images/Bubbles.png',
        name: 'Bubbles',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 6,
        logoUrl: 'https://cdn.devtonchemy.ru/images/Steam.png',
        name: 'Steam',
        createdAt: new Date(),
        updatedAt: new Date(),
        level: 2,
      },
      {
        id: 7,
        logoUrl: 'https://cdn.devtonchemy.ru/images/Mud.png',
        name: 'Mud',
        createdAt: new Date(),
        updatedAt: new Date(),
        level: 2,
      },
      {
        id: 8,
        logoUrl: 'https://cdn.devtonchemy.ru/images/Pressure.png',
        name: 'Pressure',
        createdAt: new Date(),
        updatedAt: new Date(),
        level: 2,
      },
      {
        id: 9,
        logoUrl: 'https://cdn.devtonchemy.ru/images/Light.png',
        name: 'Light',
        createdAt: new Date(),
        updatedAt: new Date(),
        level: 2,
      },
      {
        id: 10,
        logoUrl: 'https://cdn.devtonchemy.ru/images/Dust.png',
        name: 'Dust',
        createdAt: new Date(),
        updatedAt: new Date(),
        level: 2,
      },
      {
        id: 11,
        logoUrl: 'https://cdn.devtonchemy.ru/images/Ash.png',
        name: 'Ash',
        createdAt: new Date(),
        updatedAt: new Date(),
        level: 2,
      },
    ]);
  },

  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
    await db.collection('artifacts').deleteMany();
  },
};
