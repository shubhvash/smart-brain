const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const UserCredential = require('../models/user-credential');
const User = require('../models/user');
const bcrypt = require('bcryptjs');

router.post('/', (req, res) => {
    if (!req.body) {
        res.status(400).send({error: "Email and Password not present in request"});
        return;
    }

    const { email, password, name } = req.body;

    if (!email) {
        res.status(400).send({error: "Email not present in request"});
        return;
    }

    if (!password) {
        res.status(400).send({error: "Password not present in request"});
        return;
    }

    if (!name) {
        res.status(400).send({error: "Name not present in request"});
        return;
    }

    UserCredential.findOne({ email }).then(user => {
        if (user) {
            res.status(400).send({error: "User already signed up"});
            return;
        }

        const hash = bcrypt.hashSync(password);

        const userCredential = new UserCredential({ email, password: hash });

        userCredential.save().then(() => {
            const user = new User({ _id: userCredential.id, email, name });
            user.save().then(() => {
                res.status(201).send(user);
            });
        });
    }).catch(() => {
        res.status(500).send({ error: "Internal Server Error" });
    });
});

router.get('/me', auth.authenticate, (req, res) => {
    User.findOne({ _id: req.session.userId }).then(user => {
        res.send(user);
    }).catch(() => {
        res.status(500).send({ error: "Internal Server Error" });
    });
});

router.get('/:userId', (req, res) => {
    User.findOne({ _id: req.params.userId }).then(user => {
        res.send(user);
    }).catch(() => {
        res.status(500).send({ error: "Internal Server Error" });
    });
});

router.put('/image', auth.authenticate, (req, res) => {
    if (!req.session.userId) {
        res.send(401).send({ error: "Not logged in"});
    }

    User.findOne({ _id: req.session.userId })
    .then(user => {
        let entries = user.entries;
        entries++;
        User.updateOne({ _id: req.session.userId }, {entries}).then(() => {
            res.status(201).send({entries});
        }).catch(() => {
            res.status(500).send({ error: "Internal Server Error" });
        });
    })
    .catch(() => {
        res.status(500).send({ error: "Internal Server Error" });
    });
});

module.exports = router;