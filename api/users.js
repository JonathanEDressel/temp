const { Router } = require('express')
const bcrypt = require('bcryptjs')
const { generateAuthToken, requireAuthentication } = require('../lib/auth')
const { Business } = require('../models/business')
const { Photo } = require('../models/photo')
const { Review } = require('../models/review')
const { User, UserClientFields, getUserById } = require('../models/user')
const { ValidationError } = require('sequelize')
const { redirect } = require('express/lib/response')

const router = Router()

/*
 * Route to list all of a user's businesses.
 */
router.get('/:userId/businesses', async function (req, res) {
  const userId = req.params.userId
  const userBusinesses = await Business.findAll({ where: { ownerId: userId }})
  res.status(200).json({
    businesses: userBusinesses
  })
})

router.post('/', async function (req, res) {
  try {
    const user = await User.create(req.body, UserClientFields)
    res.status(201).send({ id: user.id })
  } catch (e) {
    if (e instanceof ValidationError) {
      res.status(400).send({ error: e.message })
    } else {
      throw e
    }
  }
})

router.post('/login', async function (req, res) {
  try {
    if(req.body && req.body.id && req.body.password) {  
      const userId = req.body.id
      const admin = req.body.isAdmin
      const password = req.body.password
      const user = await User.findByPk(req.body.id)

      const authenticated = user && await bcrypt.compare(
        password,
        user.password
      )
      console.log("-- authenticated:", authenticated)
      if (authenticated) {
        const token = generateAuthToken(userId, admin)
        res.status(200).send({ 
          token: token
        })
      }
      else {
        res.status(401).send({
          error: "Invalid username or password"
        })
      }
    }
    else {
      res.status(400).send({
        error: "Must provide a username and password"
      })
    }
  } catch (e) {
    if(e instanceof ValidationError) {
      res.status(401).send({ error: e.message })
    } else {
      throw e
    }
  }
})

router.get('/:userId', requireAuthentication, async function (req, res, next) {
  // console.log("--req.user:", req.user)
  // console.log("--req.params:", req.params)
  const userId = req.params.userId
  if (req.user != userId) {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  } else {
    try {
      const photos = await Photo.findByPk(userId)
      const reviews = await Review.findByPk(userId)
      const user = await getUserById(userId, true)
      // console.log("user:", user)
      if (user) {
        res.status(200).send({
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin
          // reviews
        });
      } else {
        next();
      }
    } catch (err) {
      console.error("  -- Error:", err);
      res.status(500).send({
        error: "Error fetching user. Try again later."
      });
    }
  }
})

/*
 * Route to list all of a user's reviews.
 */
router.get('/:userId/reviews', async function (req, res) {
  const userId = req.params.userId
  const userReviews = await Review.findAll({ where: { userId: userId }})
  res.status(200).json({
    reviews: userReviews
  })
})

/*
 * Route to list all of a user's photos.
 */
router.get('/:userId/photos', async function (req, res) {
  const userId = req.params.userId
  const userPhotos = await Photo.findAll({ where: { userId: userId }})
  res.status(200).json({
    photos: userPhotos
  })
})

module.exports = router
