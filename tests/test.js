const { User, Device, Board } = require('../postgresql/databaseConnection');

(async () => {
  const allAccessibles = await Board.find({
    where: { id: 'c7acf7ff-ae30-48a1-8ee2-a79624300c16' },
    attributes: ['id'],
    include: [
      {
        model: User,
        as: 'editor',
        attributes: ['id'],
      },
    ],
  })
  console.log(allAccessibles)
})()
