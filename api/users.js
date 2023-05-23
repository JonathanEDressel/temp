const { Router } = require('express')
const bcrypt = require('bcryptjs')
const { generateAuthToken, requireAuthentication } = require('../lib/auth')
const { Business } = require('../models/business')
const { Photo } = require('../models/photo')
const { Review } = require('../models/review')
const { User, UserClientFields, getUserById } = require('../models/user')
const { ValidationError } = require('sequelize')
const seq = require('../lib/sequelize')
const { redirect } = require('express/lib/response')

const router = Router()

/*
 * Route to list all of a user's businesses.
 */
router.get('/:ownerId/businesses', requireAuthentication, async function (req, res) {
  const ownerId = req.params.ownerId
  if(req.user == ownerId) {
    try {
      const business = await Business.findAll({ where: { ownerId: ownerId }})
      if(business) {
        res.status(200).send({
          businesses: business
        })
      }
      else {
        next()
      }
    } catch (err) {
      res.status(500).send({
        error: "Cannot get business(es)."
      })
    }
  } 
  else {
    res.status(403).send({
      error: "Cannot access the user"
    })
  }
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
      if(admin == null)
        admin = 0
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
  const userId = req.params.userId
  if (req.user != userId) {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  } else {
    try {
      const user = await getUserById(userId, true)
      if(user.isAdmin == 1)
        console.log("USER IS A ADMIN")
      else 
        console.log("USER IS NOT AN ADMIN")
      if (user) {
        res.status(200).send({
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin
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
router.get('/:userId/reviews', requireAuthentication, async function (req, res) {
  const userId = req.params.userId
  if(req.user == userId) {
    try {
      const reviews = await Review.findAll({ where: { userId: userId }})
      if(reviews) {
        res.status(200).send({
          reviews: reviews
        })
      }
      else {
        next()
      }
    } catch (err) {
      res.status(500).send({
        error: "Cannot get review(s)."
      })
    }
  } 
  else {
    res.status(403).send({
      error: "Cannot access the user"
    })
  }
})

/*
 * Route to list all of a user's photos.
 */
router.get('/:userId/photos', requireAuthentication, async function (req, res) {
  const userId = req.params.userId
  console.log("--userId:", userId)
  console.log("--req.user:", req.user)
  if(req.user == userId) {
    try {
      const photos = await Photo.findAll({ where: { userId: userId }})
      console.log("--photos:", photos)
      if(photos) {
        res.status(200).send({
          photos: photos
        })
      }
      else {
        next()
      }
    } catch (err) {
      res.status(500).send({
        error: "Cannot get photo(s)."
      })
    }
  } 
  else {
    res.status(403).send({
      error: "Cannot access the user"
    })
  }
})

module.exports = router
