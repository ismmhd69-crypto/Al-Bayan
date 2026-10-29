// Private French draft assembled from data/french-batches/ask-status-*.json.
// Do not import into the live Ask flow until French support is separately approved.
export const richTextFr = {
  "checkReceipt": "Vérifier à nouveau",
  "continuationNotice": "La réponse n’est pas terminée. Reprenez à partir des éléments déjà vérifiés ci-dessus.",
  "continuationIssues": {
    "expired": "Cette tentative ne peut plus être poursuivie. Les explications déjà vérifiées restent visibles ci-dessus. Vous pouvez poser une nouvelle question.",
    "busy": "Cette tentative est toujours en cours. Veuillez patienter.",
    "limit": "Cette tentative n’a pas pu aboutir. Les explications déjà vérifiées restent visibles ci-dessus.",
    "billing_uncertain": "Cette tentative a été mise en pause avant que la réponse soit prête. Vérifiez si elle peut être poursuivie.",
    "cancelled": "Cette tentative a été arrêtée."
  },
  "sourceCardNotice": "Ces passages ont passé les contrôles de pertinence et de contexte. Ce sont des sources, pas une explication vérifiée de votre question.",
  "sourceCardWorking": "Des passages coraniques pertinents ont été trouvés. Leur explication est en cours de préparation et de vérification…",
  "sourceRoles": {
    "direct": "Preuve directe pour un point demandé",
    "background": "Contexte complémentaire",
    "limited_example": "Un exemple limité, pas une règle générale"
  },
  "failures": {
    "summary_provider_rejection": "Le résumé final n’a pas pu être généré car le service de rédaction a rejeté la demande. Les sections vérifiées restent visibles ci-dessus ; aucune réponse finale n’a été terminée.",
    "summary_timeout": "Le temps imparti au résumé final est écoulé. Les sections vérifiées restent visibles ci-dessus ; aucune réponse finale n’a été terminée.",
    "writer_failure": "Une explication n’a pas pu être générée. Les sections déjà vérifiées restent visibles ci-dessus ; aucune réponse finale n’a été terminée."
  },
  "sourceFailures": {
    "source_revalidation": "Les sources enregistrées n’ont pas pu être revérifiées pour cette reprise. Aucune réponse finale n’a été approuvée.",
    "evidence_selection": "La sélection des éléments de preuve n’a pas pu aboutir. Aucune explication non vérifiée n’est affichée.",
    "explanation_check": "La vérification de l’explication n’a pas pu aboutir. Seuls les éléments vérifiés précédemment sont conservés.",
    "source_search": "Certaines recherches de sources n’ont pas pu aboutir. Les éléments affichés ont passé les contrôles ; d’autres éléments pertinents peuvent encore manquer.",
    "verse_lookup": "Le texte de certains versets n’a pas pu être récupéré. Seuls les éléments disponibles qui ont passé les contrôles sont affichés.",
    "context_lookup": "Certains versets environnants n’ont pas pu être récupérés. Les passages qui nécessitaient ce contexte ont été masqués."
  },
  "technicalFailure": "La recherche s’est arrêtée car une étape de traitement ou de vérification a échoué. Chaque section affichée ci-dessus a passé ses propres contrôles. Aucune réponse finale n’a été enregistrée.",
  "relatedVideoNotice": "Ressources complémentaires trouvées par titre sur des chaînes agréées. Cette vidéo n’a pas été vérifiée comme preuve pour cette réponse.",
  "checkingPending": "Vérification des recherches inachevées…",
  "submitting": "Envoi de votre question…",
  "queued": "Votre question attend le début de la recherche…",
  "reconnecting": "Reconnexion à la même recherche…",
  "refreshing": "Nouvelle vérification des sources d’origine…",
  "stopping": "Confirmation de l’arrêt de la recherche…",
  "saving": "Enregistrement de la réponse vérifiée…",
  "resume": "Reprendre la recherche",
  "continueResearch": "Continuer la réponse",
  "patientNotice": "Ces commentaires ont passé les vérifications automatiques. La recherche continue ; la réponse finale n’est pas encore prête.",
  "patientPaused": "La recherche est en pause. Vos sections vérifiées sont conservées. Reprendre la recherche poursuit le travail inachevé dans cette même tâche.",
  "patientSummaryWaiting": "Le résumé final apparaîtra une fois les recherches et vérifications nécessaires terminées.",
  "patientStates": {
    "searching": "Recherche dans ce groupe de sources…",
    "checking": "Vérification de ce commentaire…",
    "ready": "Le commentaire vérifié est prêt.",
    "empty": "Aucune preuve directement pertinente n’a été retenue dans ce groupe.",
    "needs_attention": "Cette étape doit être examinée avant de pouvoir terminer la réponse finale."
  },
  "reconnectFailed": "La connexion a été interrompue. Reprendre vérifie la même recherche sans envoyer de nouvelle question.",
  "cancelFailed": "L’arrêt n’a pas pu être confirmé. Réessayez d’appuyer sur Arrêter ; la recherche est peut-être toujours en cours.",
  "notRunning": "La recherche n’est plus en cours. Aucune nouvelle demande n’a été envoyée.",
  "changed": "Cette réponse n’a pas pu être vérifiée à nouveau. Ses sections précédentes ont été masquées. Aucune nouvelle question n’a été envoyée.",
  "chatFull": "Commencez une nouvelle discussion pour continuer. Cette discussion a atteint sa limite d’historique.",
  "saveFailed": "La réponse est prête, mais l’enregistrement de la discussion a échoué. Reprendre peut réessayer sans générer une autre réponse.",
  "scopeNotice": "Informations générales tirées des sources affichées. Une situation personnelle peut nécessiter un conseil distinct.",
  "aiTranslation": "Traduction automatique à l’écran, vérifiée automatiquement par rapport à cet extrait",
  "humanTranslation": "Traduction humaine, vérifiée automatiquement par rapport à cet extrait",
  "humanReviewedTranslation": "Traduction révisée par une personne",
  "translationLookupFailed": "La traduction n’a pas pu être chargée. Le texte arabe original reste disponible.",
  "translationNotChecked": "Aucune traduction vérifiée par rapport à cet extrait précis n’est disponible.",
  "translationRejected": "Une traduction a été masquée car sa correspondance avec cet extrait n’a pas pu être confirmée.",
  "noCheckedSections": "Cette tentative n’a pas permis de produire une réponse vérifiée. Rien n’a été enregistré.",
  "nextByGuide": {
    "clarify_application": "Quelle condition de l’explication citée souhaitez-vous mieux comprendre ? Pour un conseil sur une situation précise, consultez un savant qualifié sans partager ici de noms ni de détails personnels.",
    "study_evidence": "Ouvrez un passage cité et lisez son contexte. Vous pouvez demander en quoi ce passage étaye la réponse ou quelles en sont les limites.",
    "learn_steps": "Lisez ensemble les étapes et conditions citées. Demandez des précisions sur toute étape qui n’est pas claire avant d’appliquer cette explication générale à votre situation."
  },
  "limited": "Certaines recherches de sources ou explications n’ont pas pu être terminées. Cette réponse repose uniquement sur les sources affichées ci-dessus ; les sections manquantes n’ont pas été vérifiées.",
  "stopped": "La réponse a été arrêtée. Aucune nouvelle tentative automatique n’a été lancée.",
  "checkFailure": "La réponse n’a pas pu être affichée en toute sécurité. Aucune nouvelle tentative automatique n’a été lancée.",
  "titles": {
    "quran": "Extrait du Coran",
    "hadith": "Extrait de la Sunna",
    "scholar": "Explications des savants",
    "summary": "Résumé de Bayan"
  },
  "outcomes": {
    "not_checked": "Ce groupe a été masqué car il n’a pas été possible d’établir une réponse complète et étayée.",
    "no_direct_evidence": "Aucune preuve directement pertinente n’a été retenue dans ce groupe de sources. Cela ne signifie pas qu’il n’en existe aucune.",
    "unavailable": "La recherche dans cette source est indisponible. Cette section n’a pas pu être vérifiée.",
    "timeout": "Le délai de recherche dans cette source a expiré. Cela ne prouve pas qu’aucune preuve pertinente n’existe.",
    "search_failed": "La recherche dans cette source a échoué. Ses éléments n’ont pas pu être vérifiés.",
    "failed_check": "Aucune explication vérifiée n’a pu être fournie. Elle a été masquée."
  },
  "progress": {
    "retrying_selection": "Un problème est survenu lors de la sélection des sources. Nouvelle vérification en cours…",
    "correcting_summary": "Révision de la conclusion de Bayan…",
    "understanding": "Compréhension de votre question…",
    "searching": "Recherche de passages pertinents dans le Coran, la Sunna et les explications de savants approuvés…",
    "checking_evidence": "Vérification des preuves et du contexte…",
    "writing_quran": "Préparation des explications…",
    "checking_quran": "Vérification de l’explication du Coran…",
    "checking_hadith": "Vérification de l’explication de la Sunna…",
    "checking_scholar": "Vérification des explications savantes…",
    "finding_videos": "Vérification de vidéos facultatives pour approfondir…",
    "checking_remaining": "Mise en cohérence des explications vérifiées…"
  },
  "automatic": "Réponse vérifiée automatiquement. Une révision savante indépendante reste une étape distincte.",
  "researchDetails": "Détails de la recherche",
  "incomplete": "Cette réponse est incomplète. Les sections ci-dessus ont passé leurs contrôles individuels, mais aucune conclusion finale n’a été achevée. Elle n’a pas été enregistrée.",
  "withdrawn": "La section précédente a été retirée car la réponse complète n’a pas permis de la confirmer. Veuillez ne pas vous y fier.",
  "interrupted": "La connexion a été interrompue avant la fin de la réponse. Aucune nouvelle demande n’a été envoyée.",
  "stop": "Arrêter la réponse",
  "source": "Lire la source",
  "original": "Passage original et traduction",
  "citedExcerpts": "Consulter les extraits des sources citées",
  "missing": "Aucune traduction vérifiée n’est disponible ici. Le texte arabe original est affiché.",
  "guidance": "Votre prochaine étape",
  "next": "Posez une question précise sur les preuves ou leur lien avec votre question. Une situation personnelle peut nécessiter l’avis d’un savant qualifié."
} as const;
