/* Constructeurs de questions. QCM : la bonne réponse est TOUJOURS en premier (mélangée à l'affichage). */
const Q=(q,o,e,r)=>({t:'qcm',q,o,e,r});
const V=(q,a,e,r)=>({t:'vf',q,a,e,r});
const F=(q,ans,e,r)=>({t:'fill',q,ans,e,r});
const O=(q,model,pts,r)=>({t:'open',q,model,pts,r});
const SUBJECTS={
  dc:{name:"Droit constitutionnel",short:"Droit constitutionnel",theme:"Régime politique sénégalais"},
  ij:{name:"Institutions judiciaires",short:"Institutions judiciaires",theme:"Organisation de la justice au Sénégal"},
  ii:{name:"Institutions internationales",short:"Institutions internationales",theme:"L'État, la diplomatie et la CEDEAO"}
};
