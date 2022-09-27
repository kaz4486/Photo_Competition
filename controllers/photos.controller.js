const Photo = require('../models/photo.model');
const escape = require('../utils/escapeHtml');
// const ip = require('../middlewares/Request-id');
const requestIp = require('request-ip');
const Voter = require('../models/Voter.model');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {
  try {
    const { title, author, email } = req.fields;
    const escapedTitle = escape(title);
    const escapedAuthor = escape(author);
    const escapedEmail = escape(email);
    // console.log('jestem');
    // const pattern = new RegExp(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g);
    // console.log('tu');
    // const emailMatched = email.match(pattern).join('');
    // console.log(emailMatched, email);
    // console.log(emailMatched.length, email.length);
    // console.log('i tu');
    // if (emailMatched.length < email.length)
    //   res.status(500).json({ message: 'Invalid characters...' });
    // console.log('a tu?');
    const file = req.files.file;
    const fileExtension = file.name.split('.').slice(1)[0];

    if (
      escapedTitle &&
      escapedAuthor &&
      escapedEmail &&
      file &&
      fileExtension === 'jpg'
    ) {
      // if fields are not empty...
      // /^[A-Z]{3}$/)
      // const reg = /^[a-z\d]+[\w\d.-]*@(?:[a-z\d]+[a-z\d-]+\.){1,5}[a-z]{2,6}$/i;

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const newPhoto = new Photo({
        title,
        author,
        email,
        src: fileName,
        votes: 0,
      });
      await newPhoto.save(); // ...save new photo in DB
      res.json(newPhoto);
    } else {
      throw new Error('Wrong input!');
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {
  try {
    res.json(await Photo.find());
  } catch (err) {
    res.status(500).json(err);
  }
};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {
  const clientIp = requestIp.getClientIp(req);
  try {
    const voterToUpdate = await Voter.findOne({ user: clientIp });
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });

    if (!photoToUpdate) res.status(404).json({ message: 'Not found' });

    if (!voterToUpdate) {
      const newVoter = new Voter({ user: clientIp, votes: photoToUpdate._id });
      await newVoter.save();
      photoToUpdate.votes++;
      photoToUpdate.save();
      res.send({ message: 'OK with newVoter' });
    } else {
      const voterWithPhoto = await Voter.findOne({ votes: photoToUpdate._id });
      if (!voterWithPhoto) {
        await Voter.findOneAndUpdate(
          { user: clientIp },
          { $push: { votes: photoToUpdate._id } }
        );
        photoToUpdate.votes++;
        photoToUpdate.save();
        res.send({ message: 'OK with oldVoter' });
      } else {
        res.status(500).json({ message: 'Vote error' });
      }
    }
  } catch (err) {
    res.status(500).json(err);
  }
};
