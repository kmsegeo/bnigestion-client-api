const errorhandling = async (err, req, res, next) => {
    console.error(err.stack);

    await res.status(500).json({
        status: "ERROR",
        message: err.message ? err.message : "Erreur inconnue !",
        description: err.detail,
        date: new Date(),
        source: req.url
    });
}

module.exports = errorhandling;