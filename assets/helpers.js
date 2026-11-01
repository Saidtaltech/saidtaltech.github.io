/* Constructeurs de questions. QCM : la bonne réponse est TOUJOURS en premier (mélangée à l'affichage). */
const Q=(q,o,e,r)=>({t:'qcm',q,o,e,r});
const V=(q,a,e,r)=>({t:'vf',q,a,e,r});
const F=(q,ans,e,r)=>({t:'fill',q,ans,e,r});
const O=(q,model,pts,r)=>({t:'open',q,model,pts,r});
