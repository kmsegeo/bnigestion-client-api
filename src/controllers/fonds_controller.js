const getAllFonds = async (req, res, next) => {
    return res.status(200).json({ message: "Liste des fonds disponible", data: [] });
 }
const getFondsById = async (req, res, next) => { 
    return res.status(200).json({ message: `Détails du fonds ${req.params.id}`, data: {} });
}

module.exports = {
    getAllFonds,
    getFondsById    
}