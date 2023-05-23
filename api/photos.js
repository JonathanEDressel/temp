const { Router } = require('express')
const { ValidationError } = require('sequelize')
const { requireAuthentication } = require('../lib/auth')

const { Photo, PhotoClientFields } = require('../models/photo')

const router = Router()

/*
 * Route to create a new photo.
 */
router.post('/', requireAuthentication, async function (req, res, next) {
  console.log("--req.user:", req.user)
  console.log("--req.body.userId:", req.body.userId)
  if(parseInt(req.user) != parseInt(req.body.userId)) {
    res.status(403).send({
    error: "Cannot access the photo"
    })
  }
  else {
    try {
      const id = await Photo.create(req.body, PhotoClientFields)
      res.status(201).send({
        id: id,
        links: {
          photo: `/photos/${id}`,
          business: `/businesses/${req.body.businessId}`
        }
      })
    } catch (err) {
      res.status(500).send({
        error: "Cannot insert photo into the database"
      })
    }
  }
  // try {
  //   const photo = await Photo.create(req.body, PhotoClientFields)
  //   res.status(201).send({ id: photo.id })
  // } catch (e) {
  //   if (e instanceof ValidationError) {
  //     res.status(400).send({ error: e.message })
  //   } else {
  //     throw e
  //   }
  // }
})

/*
 * Route to fetch info about a specific photo.
 */
router.get('/:photoId', async function (req, res, next) {
  const photoId = req.params.photoId
  const photo = await Photo.findByPk(photoId)
  if (photo) {
    res.status(200).send(photo)
  } else {
    next()
  }
})

/*
 * Route to update a photo.
 */
router.patch('/:photoId', async function (req, res, next) {
  const photoId = req.params.photoId

  /*
   * Update photo without allowing client to update businessId or userId.
   */
  const result = await Photo.update(req.body, {
    where: { id: photoId },
    fields: PhotoClientFields.filter(
      field => field !== 'businessId' && field !== 'userId'
    )
  })
  if (result[0] > 0) {
    res.status(204).send()
  } else {
    next()
  }
})

/*
 * Route to delete a photo.
 */
router.delete('/:photoId', async function (req, res, next) {
  const photoId = req.params.photoId
  const result = await Photo.destroy({ where: { id: photoId }})
  if (result > 0) {
    res.status(204).send()
  } else {
    next()
  }
})

module.exports = router
