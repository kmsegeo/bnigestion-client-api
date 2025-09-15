const db = require('../config/database');

const Acteur = {  

  tableName: '_sc_auth.t_acteur',

  async create({nom_complet, email, telephone, adresse, type_acteur}) {
    
    const queryString = `
      INSERT INTO ${this.tableName} (
        r_nom_complet,
        r_email,
        r_telephone_prp,
        r_adresse,
        r_date_creer,
        r_date_modif,
        r_statut,
        e_type_acteur) 
      VALUES($1,$2,$3,$4,$5,$6,$7,$8) 
      RETURNING 
        r_i,
        r_nom_complet, 
        r_email, 
        r_telephone_prp, 
        r_adresse
        r_date_creer, 
        r_date_modif, 
        r_date_activation, 
        r_statut,
        e_type_acteur`;

        const create_date = new Date();

        const res = await db.query(queryString, [
          nom_complet, 
          email, 
          telephone,
          adresse, 
          create_date, 
          create_date,
          0, 
          type_acteur
        ]);
        
      return res.rows[0];
  },

  async findById(id) {
    
      const queryString = `
        SELECT 
          r_nom_complet, 
          r_email, 
          r_telephone_prp, 
          r_telephone_scd, 
          r_adresse,
          r_date_creer, 
          r_date_modif, 
          r_date_activation,
          r_profil_investisseur,
          r_langue, 
          r_statut,
          e_type_acteur
        FROM ${this.tableName} 
        WHERE r_i = $1`;

      const res = await db.query(queryString, [id]);
      return res.rows[0];
  },

  async findByEmail(email) {

    const queryString = `
      SELECT 
        r_i,
        r_nom_complet, 
        r_email, 
        r_telephone_prp, 
        r_telephone_scd, 
        r_adresse,
        r_date_creer, 
        r_date_modif, 
        r_date_activation,
        r_profil_investisseur,
        r_langue,
        r_mdp, 
        r_statut,
        e_type_acteur
      FROM ${this.tableName} 
      WHERE r_email = $1`;
      
    const res = await db.query(queryString, [email]);
    return res.rows[0];
  },

  async findByTelephone(telephone) {

    const queryString = `
      SELECT 
        r_i,
        r_nom_complet, 
        r_email, 
        r_telephone_prp, 
        r_telephone_scd, 
        r_adresse,
        r_date_creer, 
        r_date_modif, 
        r_date_activation,
        r_profil_investisseur,
        r_langue,
        r_mdp, 
        r_statut,
        e_type_acteur
      FROM ${this.tableName} 
      WHERE r_telephone_prp = $1`;
    const res = await db.query(queryString, [telephone]);
    return res.rows[0];
  },

  async findByEmailOrMobile(identifiant) {

    const queryString = `SELECT 
        r_i,
        r_nom_complet, 
        r_email, 
        r_telephone_prp, 
        r_telephone_scd, 
        r_adresse,
        r_date_creer, 
        r_date_modif, 
        r_date_activation,
        r_profil_investisseur,
        r_langue,
        r_mdp, 
        r_statut,
        e_type_acteur
      FROM ${this.tableName} 
      WHERE r_email = $1 OR r_telephone_prp = $1`;
      
    const res = await db.query(queryString, [identifiant]);
    return res.rows[0];
  },

  async findAllByTypeActeur(typeActeur) {
    const res = await db.query(`SELECT * FROM ${this.tableName} WHERE e_type_acteur=$1`, [typeActeur]);
    return res.rows;
  },

  // async findAllByProfil(profil) {
  //   const res = await db.query(`
  //     SELECT act.*, agt.e_profil 
  //     FROM ${this.tableName} As act 
  //     INNER JOIN t_agent As agt 
  //     ON act.e_agent=agt.r_i 
  //     WHERE agt.e_profil=$1`, [profil]);
  //   return res.rows;
  // },

  // async findByParticulierId(particulier_id) {
  //   const res = await db.query(`SELECT * FROM ${this.tableName} WHERE e_particulier=$1`, [particulier_id]);
  //   return res.rows[0];
  // },
  
  // async findByEntrepriseId(entreprise_id) {
  //   const res = await db.query(`SELECT * FROM ${this.tableName} WHERE e_entreprise=$1`, [entreprise_id]);
  //   return res.rows[0];
  // },
  
  async update(id, {nom_complet, adresse, langue}) {
    const queryString = `UPDATE ${this.tableName} SET 
      r_nom_complet=$1,
      r_adresse=$2,
      r_date_modif=$3,
      r_langue=$4
    WHERE r_i=$5 
    RETURNING r_i,
        r_nom_complet, 
        r_email, 
        r_telephone_prp, 
        r_telephone_scd, 
        r_adresse, 
        r_date_creer, 
        r_date_modif,
        r_profil_investisseur,
        r_langue, 
        r_statut,
        e_type_acteur`;
    const res = await db.query(queryString, [nom_complet, adresse, new Date(),langue, id])
    return res.rows[0];
  },

  async updateProfilInvestisseur(acteur_id, profil) {
    const queryString = `UPDATE ${this.tableName} 
      SET profil_investisseur=$1 
      WHERE r_i=$2 
      RETURNING r_i,
        r_nom_complet, 
        r_email, 
        r_telephone_prp, 
        r_telephone_scd, 
        r_adresse,
        r_date_creer, 
        r_date_modif, 
        r_date_activation,
        r_profil_investisseur,
        r_langue, 
        r_statut,
        e_type_acteur`;
    const res = await db.query(queryString, [profil, acteur_id])
    return res.rows[0];
  },

  async updateStatus(acteur_id, status) {
    const queryString = `UPDATE ${this.tableName} 
      SET r_statut=$1 
      WHERE r_i=$2 
      RETURNING r_i,
        r_nom_complet, 
        r_email, 
        r_telephone_prp, 
        r_telephone_scd, 
        r_adresse,
        r_date_creer, 
        r_date_modif, 
        r_date_activation,
        r_profil_investisseur,
        r_langue, 
        r_statut,
        e_type_acteur`;
    const res = await db.query(queryString, [status, acteur_id])
    return res.rows[0];
  },

  // async updateRepresentant(acteur_id, representant_id) {
  //   const queryString = `UPDATE ${this.tableName} SET e_represantant=$1 WHERE r_i=$2 RETURNING r_i,
  //       r_nom_complet, 
  //       r_email, 
  //       r_telephone_prp, 
  //       r_telephone_scd, 
  //       r_adresse, 
  //       r_statut,
  //       r_date_creer, 
  //       r_date_modif, 
  //       r_date_activation,
  //       r_profil_investisseur,
  //       r_langue,
  //       e_type_acteur`;
  //   const res = await db.query(queryString, [representant_id, acteur_id])
  //   return res.rows[0];
  // },

  async updatePassword(acteur_id, mdp) {
    const queryString = `UPDATE ${this.tableName} SET r_mdp=$1  WHERE r_i=$2 RETURNING r_mdp`;
    const res = await db.query(queryString, [mdp, acteur_id])
    return res.rows[0];
  },

  async activeCompte(acteur_id) {
    const queryString = `UPDATE ${this.tableName} SET r_statut=$1, r_date_activation=$2 WHERE r_i=$3 
      RETURNING r_i,
        r_nom_complet, 
        r_email, 
        r_telephone_prp, 
        r_telephone_scd, 
        r_adresse,
        r_date_creer, 
        r_date_modif, 
        r_date_activation,
        r_profil_investisseur,
        r_langue, 
        r_statut,
        e_type_acteur`;
    const res = await db.query(queryString, [1, new Date(), acteur_id])
    return res.rows[0];
  },

  async updateEmail(email, acteur_id) {
    const res = await db.query(`UPDATE ${this.tableName} SET r_email=$1 WHERE r_i=$2 RETURNING r_email`, [email, acteur_id]);
    return res.rows[0];
  },

  async updateTelephone(telephone, acteur_id) {
    const res = await db.query(`UPDATE ${this.tableName} SET r_telephone_prp=$1 WHERE r_i=$2 RETURNING r_telephone_prp`, [telephone, acteur_id]);
    return res.rows[0];
  }, 

  async cleanAll() {
      const res = await db.query(`DELETE FROM ${this.tableName} WHERE r_i NOT BETWEEN $1 AND $2 RETURNING r_i`, [1, 5]);
      return res.rows;
  }
}

module.exports = Acteur;