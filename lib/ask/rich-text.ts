import type { Locale } from "@/lib/i18n";

export const richText = {
  en: {
    checkReceipt: "Check again",
    continuationNotice: "The answer is unfinished. Continue from the checked work above.",
    continuationIssues: { expired: "This attempt can no longer continue. Any checked explanations remain above. You can start a new question.", busy: "This attempt is still running. Please wait.", limit: "This attempt could not finish. Any checked explanations remain above.", billing_uncertain: "This attempt paused before the answer was ready. Check whether it can continue.", cancelled: "This attempt was stopped." },
    sourceCardNotice: "These passages passed relevance and context checks. They are source material, not a checked explanation of your question.",
    sourceCardWorking: "Relevant Quran passages found. We’re preparing and checking their explanation…",
    sourceRoles: { direct: "Direct evidence for a requested point", background: "Supporting context", limited_example: "A limited example; not a general rule" },
    failures: { summary_provider_rejection: "The final summary could not be generated because the writing service rejected the request. Checked sections are kept above; no final answer was completed.", summary_timeout: "The final summary ran out of time. Checked sections are kept above; no final answer was completed.", writer_failure: "An explanation could not be generated. Any checked sections are kept above; no final answer was completed." },
    sourceFailures: { source_revalidation: "The saved sources could not be rechecked for this continuation. A final answer has not been approved.", evidence_selection: "Evidence selection could not finish. No unchecked explanation is shown.", explanation_check: "The explanation could not finish its checks. Only earlier checked material is kept.", source_search: "Some source searches could not finish. The displayed evidence passed its checks; other relevant evidence may still be missing.", verse_lookup: "Some verse text could not be retrieved. Only available evidence that passed its checks is shown.", context_lookup: "Some surrounding verses could not be retrieved. Passages that needed that context were withheld." },
    technicalFailure: "Research stopped because part of processing or checking failed. Any sections shown above passed their individual checks. No final answer was saved.",
    relatedVideoNotice: "Further learning matched by title from approved channels. The recording has not been checked as evidence for this answer.",
    checkingPending: "Checking for unfinished research…",
    submitting: "Sending your question…",
    queued: "Your question is waiting for research to begin…",
    reconnecting: "Reconnecting to the same research job…",
    refreshing: "Rechecking the original sources…",
    stopping: "Confirming that research has stopped…",
    saving: "Saving the checked answer…",
    resume: "Resume research",
    continueResearch: "Continue answer",
    patientNotice: "These explanations passed automatic checks. Research is continuing; the final answer is not ready yet.",
    patientPaused: "Research is paused. Your checked sections are kept. Continue research resumes the unfinished work in this same job.",
    patientSummaryWaiting: "The final summary will appear after the necessary research and checks are complete.",
    patientStates: { searching: "Searching this source group…", checking: "Checking this explanation…", ready: "Checked explanation ready.", empty: "No directly relevant evidence was selected from this group.", needs_attention: "This step needs attention before the final answer can be completed." },
    reconnectFailed:
      "The connection was interrupted. Resume checks the same research job without sending a new question.",
    cancelFailed:
      "Stop could not be confirmed. Please try Stop again; the research may still be running.",
    notRunning: "Research is no longer running. No new request was made.",
    changed:
      "This answer could not be revalidated. Its earlier sections have been hidden. No new question was sent.",
    chatFull:
      "Start a new chat to continue. This chat has reached its history limit.",
    saveFailed:
      "The answer is ready, but saving the chat failed. Resume can retry saving without generating another answer.",
    scopeNotice:
      "General information from the sources shown. Individual circumstances may need separate advice.",
    aiTranslation:
      "AI display translation, automatically checked against this excerpt",
    humanTranslation:
      "Human translation, automatically checked against this excerpt",
    humanReviewedTranslation: "Human-reviewed translation",
    translationLookupFailed:
      "The translation could not be loaded. The Arabic original remains available.",
    translationNotChecked:
      "No translation checked against this exact excerpt is available.",
    translationRejected:
      "A translation was withheld because its alignment with this excerpt could not be confirmed.",
    noCheckedSections:
      "This attempt could not produce a checked answer. Nothing has been saved.",
    nextByGuide: {
      clarify_application:
        "Which condition in the cited explanation would you like to understand better? For advice about a particular situation, ask a qualified scholar without sharing names or private details here.",
      study_evidence:
        "Open a cited passage and read its context. You can ask how that particular passage supports the answer or what its limits are.",
      learn_steps:
        "Read the cited steps and conditions together. Ask about any step that is unclear before trying to apply this general explanation to your circumstances.",
    },
    limited:
      "Some source searches or explanations could not be completed. This answer is based only on the sources shown above; the missing sections have not been checked.",
    stopped: "The answer was stopped. No automatic retry was made.",
    checkFailure:
      "The answer could not be displayed safely. No automatic retry was made.",
    titles: {
      quran: "From the Quran",
      hadith: "From the Sunnah",
      scholar: "Scholars’ explanations",
      summary: "Bayan’s summary",
    },
    outcomes: {
      not_checked:
        "This group was withheld because a complete, supported answer could not be established.",
      no_direct_evidence:
        "No directly relevant evidence was selected from this source group. This does not mean that none exists.",
      unavailable:
        "This source search is unavailable. This section could not be checked.",
      timeout:
        "This source search ran out of time. This does not establish that no relevant evidence exists.",
      search_failed:
        "This source search failed. Its evidence could not be checked.",
      failed_check:
        "A checked explanation could not be supplied. It has been withheld.",
    },
    progress: {
      retrying_selection: "There was a problem selecting sources. We’re checking them again…",
      correcting_summary: "Revising Bayan's conclusion...",
      understanding: "Understanding your question…",
      searching: "Looking for relevant passages in the Quran, Sunnah and approved scholars’ explanations…",
      checking_evidence: "Checking evidence and context…",
      writing_quran: "Preparing the explanations…",
      checking_quran: "Checking the Quran explanation…",
      checking_hadith: "Checking the Sunnah explanation…",
      checking_scholar: "Checking scholarly explanations…",
      finding_videos: "Checking optional learning videos…",
      checking_remaining: "Bringing the checked explanations together…",
    },
    automatic:
      "Automatically checked answer. Independent scholarly review is still separate.",
    researchDetails: "Research details",
    incomplete:
      "This answer is incomplete. The sections above passed their individual checks, but no final conclusion was completed. It has not been saved.",
    withdrawn:
      "The earlier section was withdrawn because the full answer could not confirm it. Please do not rely on it.",
    interrupted:
      "The connection ended before the answer was complete. No new request has been made.",
    stop: "Stop answer",
    source: "Read source",
    original: "Original passage and translation",
    citedExcerpts: "Review cited source excerpts",
    missing:
      "No verified translation is available here. The Arabic original is shown here.",
    guidance: "Your next step",
    uncovered: "The sources found could not fully answer “{label}”. If that is what you meant, ask about it on its own.",
    next: "Ask a specific follow-up about the evidence or how it applies to your question. Personal circumstances may need a qualified scholar.",
  },
  ar: {
    checkReceipt: "التحقّق مجددًا",
    continuationNotice: "لم تكتمل الإجابة. يمكنك متابعة العمل انطلاقًا مما اجتاز التحقق أعلاه.",
    continuationIssues: { expired: "لم تعد متابعة هذه المحاولة متاحة. تبقى الشروح التي اجتازت التحقق أعلاه، ويمكنك بدء سؤال جديد.", busy: "ما زالت هذه المحاولة جارية. يُرجى الانتظار.", limit: "لم تتمكن هذه المحاولة من إكمال الإجابة. تبقى الشروح التي اجتازت التحقق أعلاه.", billing_uncertain: "توقفت هذه المحاولة قبل اكتمال الإجابة. تحقّق من إمكانية المتابعة.", cancelled: "أُوقفت هذه المحاولة." },
    sourceCardNotice: "اجتازت هذه النصوص التحقق من الصلة والسياق. هي مصادر للاستدلال، وليست شرحًا لسؤالك اجتاز التحقق.",
    sourceCardWorking: "وجدنا آيات مرتبطة بسؤالك، ونعمل على إعداد شرحها والتحقق منه…",
    sourceRoles: { direct: "دليل مباشر على إحدى النقاط المطلوبة", background: "سياق مساعد", limited_example: "مثال محدود، وليس قاعدة عامة" },
    failures: { summary_provider_rejection: "تعذّر إعداد الخلاصة لأن خدمة الكتابة رفضت الطلب. احتُفظ بالأقسام التي اجتازت التحقق أعلاه، ولم تكتمل إجابة نهائية.", summary_timeout: "انتهت المهلة قبل إعداد الخلاصة. احتُفظ بالأقسام التي اجتازت التحقق أعلاه، ولم تكتمل إجابة نهائية.", writer_failure: "تعذّر إعداد أحد الشروح. احتُفظ بالأقسام التي اجتازت التحقق أعلاه، ولم تكتمل إجابة نهائية." },
    sourceFailures: { source_revalidation: "تعذّر إعادة التحقق من المصادر المحفوظة عند المتابعة. لم تُعتمد إجابة نهائية.", evidence_selection: "تعذّر إكمال اختيار الأدلة. لا يُعرض شرح لم يجتز التحقق.", explanation_check: "لم يكتمل التحقق من الشرح. لا يُحتفظ إلا بما اجتاز التحقق سابقًا.", source_search: "تعذّر إكمال بعض عمليات البحث. الأدلة المعروضة اجتازت التحقق، وقد تبقى أدلة ذات صلة لم تُسترجع.", verse_lookup: "تعذّر استرجاع نص بعض الآيات. لا تُعرض إلا الأدلة المتاحة التي اجتازت التحقق.", context_lookup: "تعذّر استرجاع بعض الآيات المحيطة. حُجبت المقاطع التي تحتاج إلى هذا السياق." },
    technicalFailure: "توقف البحث بسبب تعذر إتمام المعالجة أو التحقق. الأقسام المعروضة أعلاه اجتازت التحقق الفردي. لم تُحفظ إجابة نهائية.",
    relatedVideoNotice: "للتعلّم الإضافي: مقاطع من قنوات معتمدة اختيرت بحسب العنوان. لم يُراجع التسجيل بوصفه دليلاً لهذا الجواب.",
    checkingPending: "جارٍ التحقق من وجود بحث لم يكتمل…",
    submitting: "جارٍ إرسال سؤالك…",
    queued: "سؤالك في انتظار بدء البحث…",
    reconnecting: "جارٍ استعادة الاتصال بمهمة البحث نفسها…",
    refreshing: "جارٍ التحقق مجددًا من المصادر الأصلية…",
    stopping: "جارٍ التأكد من توقف البحث…",
    saving: "جارٍ حفظ الإجابة التي اجتازت التحقق…",
    resume: "استئناف البحث",
    continueResearch: "متابعة الإجابة",
    patientNotice: "اجتازت هذه الشروح التحقق الآلي. البحث مستمر، ولم تكتمل الإجابة النهائية بعد.",
    patientPaused: "توقف البحث مؤقتًا. احتُفظ بالأجزاء التي اجتازت التحقق. متابعة البحث تستأنف العمل غير المكتمل في المهمة نفسها.",
    patientSummaryWaiting: "سيظهر الملخص النهائي بعد اكتمال البحث الضروري والتحقق من الإجابة.",
    patientStates: { searching: "جارٍ البحث في هذه المصادر…", checking: "جارٍ التحقق من هذا الشرح…", ready: "الشرح الذي اجتاز التحقق جاهز.", empty: "لم يُختَر دليل مرتبط مباشرة بالسؤال من هذه المصادر.", needs_attention: "تحتاج هذه الخطوة إلى متابعة قبل إكمال الإجابة النهائية." },
    reconnectFailed:
      "انقطع الاتصال. يتحقق الاستئناف من مهمة البحث نفسها دون إرسال سؤال جديد.",
    cancelFailed:
      "تعذّر تأكيد إيقاف البحث. حاول الضغط على إيقاف مرة أخرى؛ فقد يكون البحث مستمرًا.",
    notRunning: "لم يعد البحث قيد التنفيذ. لم يُرسل طلب جديد.",
    changed:
      "تعذّر تأكيد صلاحية هذه الإجابة مجددًا، فأُخفيت أجزاؤها السابقة. لم يُرسل سؤال جديد.",
    chatFull:
      "ابدأ محادثة جديدة للمتابعة؛ فقد بلغت هذه المحادثة الحد الأقصى لسجلها.",
    saveFailed:
      "الإجابة جاهزة، لكن تعذّر حفظ المحادثة. يمكنك استئنافها لإعادة محاولة الحفظ دون إنشاء إجابة أخرى.",
    scopeNotice:
      "معلومات عامة من المصادر المعروضة. وقد تحتاج الظروف الفردية إلى توجيه خاص.",
    aiTranslation: "ترجمة آلية للعرض، خضعت لفحص آلي بمقارنتها بهذا المقتطف",
    humanTranslation: "ترجمة بشرية خضعت لفحص آلي بمقارنتها بهذا المقتطف",
    humanReviewedTranslation: "ترجمة راجعها إنسان",
    translationLookupFailed: "تعذّر تحميل الترجمة. يبقى النص العربي متاحًا.",
    translationNotChecked:
      "لا تتوفر ترجمة اجتازت المقارنة مع هذا المقتطف بعينه.",
    translationRejected: "لم تُعرض الترجمة لتعذّر تأكيد مطابقتها لهذا المقتطف.",
    noCheckedSections:
      "تعذّر تقديم إجابة اجتازت التحقق في هذه المحاولة. لم يُحفظ شيء.",
    nextByGuide: {
      clarify_application:
        "أي شرط في الشرح المذكور تريد فهمه بصورة أوضح؟ ولطلب توجيه في حالة معينة، اسأل عالمًا مؤهلًا دون مشاركة أسماء أو تفاصيل خاصة هنا.",
      study_evidence:
        "افتح أحد النصوص المذكورة واقرأ سياقه. يمكنك السؤال عن وجه استدلال الإجابة بهذا النص أو عن حدود دلالته.",
      learn_steps:
        "اقرأ الخطوات والشروط المذكورة معًا. واسأل عما لم يتضح منها قبل محاولة تطبيق هذا الشرح العام على ظروفك.",
    },
    limited:
      "تعذّر إكمال بعض عمليات البحث أو الشروح. تستند هذه الإجابة إلى المصادر المعروضة أعلاه فقط، ولم يتم التحقق من الأقسام المفقودة.",
    stopped: "أُوقفت الإجابة، ولم تُعَد المحاولة تلقائيًا.",
    checkFailure: "تعذّر عرض الإجابة بشكل آمن، ولم تُعَد المحاولة تلقائيًا.",
    titles: {
      quran: "من القرآن",
      hadith: "من السنة",
      scholar: "شرح العلماء",
      summary: "خلاصة بيان",
    },
    outcomes: {
      not_checked:
        "لم يُعرض هذا القسم لعدم التوصل إلى إجابة مكتملة تدعمها الأدلة.",
      no_direct_evidence:
        "لم يُختَر دليل مباشر من هذا النوع من المصادر. وهذا لا يعني عدم وجود دليل.",
      unavailable:
        "البحث في هذا المصدر غير متاح، ولم يمكن التحقق من هذا القسم.",
      timeout:
        "انتهت مهلة البحث في هذا المصدر. وهذا لا يثبت عدم وجود دليل ذي صلة.",
      search_failed: "تعذّر البحث في هذا المصدر، فلم يمكن التحقق من أدلته.",
      failed_check: "تعذّر تقديم شرح اجتاز التحقق، ولذلك لم يُعرض.",
    },
    progress: {
      retrying_selection: "حدثت مشكلة أثناء اختيار المصادر، نتحقق منها مرة أخرى…",
      correcting_summary: "نراجع صياغة خلاصة بيان…",
      understanding: "نفهم سؤالك…",
      searching: "نبحث عن النصوص المرتبطة بسؤالك في القرآن والسنة وشروح العلماء المعتمدين…",
      checking_evidence: "نتحقق من الأدلة وسياقها…",
      writing_quran: "نُعِدّ الشروح…",
      checking_quran: "نتحقق من شرح الآيات…",
      checking_hadith: "نتحقق من شرح السنة…",
      checking_scholar: "نتحقق من شرح العلماء…",
      finding_videos: "نتحقق من مقاطع إضافية للتعلّم…",
      checking_remaining: "نجمع الشروح التي اجتازت التحقق في إجابة مترابطة…",
    },
    automatic:
      "إجابة خضعت للتحقق الآلي. المراجعة العلمية المستقلة مرحلة منفصلة.",
    researchDetails: "تفاصيل البحث",
    incomplete:
      "هذه الإجابة غير مكتملة. اجتازت الأقسام أعلاه التحقق الفردي، لكن لم تكتمل الخلاصة النهائية. لم تُحفظ الإجابة.",
    withdrawn:
      "سُحب القسم السابق لأن التحقق من الإجابة كاملة لم يؤكده. يُرجى عدم الاعتماد عليه.",
    interrupted: "انقطع الاتصال قبل اكتمال الإجابة. لم يُرسَل طلب جديد.",
    stop: "إيقاف الإجابة",
    source: "قراءة المصدر",
    original: "النص الأصلي والترجمة",
    citedExcerpts: "مراجعة نصوص المصادر المستشهد بها",
    missing: "لا تتوفر هنا ترجمة موثقة. النص العربي الأصلي معروض هنا.",
    guidance: "خطوتك التالية",
    uncovered: "لم تكفِ المصادر التي وُجدت للإجابة الكاملة عن «{label}». إن كان هذا ما تقصده، فاسأل عنه وحده.",
    next: "اسأل سؤال متابعة محددًا عن الدليل أو صلته بسؤالك. وقد تحتاج ظروفك الشخصية إلى سؤال عالم مؤهل.",
  },
  de: {
    checkReceipt: "Prüfen, ob die Recherche fortgesetzt werden kann",
    continuationNotice: "Geprüfte Abschnitte bleiben erhalten. Fortsetzen bearbeitet offene Schritte mit begrenztem Budget. Diese Möglichkeit läuft nach 20 Minuten ab und kann entfallen, wenn die Verbindung nicht wiederhergestellt werden kann.",
    continuationIssues: { expired: "Diese Recherche kann nicht mehr fortgesetzt werden. Geprüfte Abschnitte bleiben sichtbar. Du kannst eine neue Frage beginnen.", busy: "Diese Recherche läuft noch. Es wurde keine zusätzliche Arbeit gestartet.", limit: "Das Recherchelimit wurde erreicht. Geprüfte Abschnitte bleiben erhalten; es wurde keine weitere Arbeit gestartet.", billing_uncertain: "Die Recherche kann erst fortgesetzt werden, wenn eine frühere Serviceanfrage abgerechnet ist. Geprüfte Abschnitte bleiben erhalten; es wurde keine neue kostenpflichtige Anfrage gesendet.", cancelled: "Diese Recherche wurde gestoppt. Es wurde keine weitere Arbeit gestartet." },
    sourceCardNotice: "Diese Quellentexte haben die Prüfung auf Relevanz und Kontext bestanden. Ihre Erklärung wird noch geprüft; die endgültige Antwort ist noch nicht fertig. Sie können nur einen Teil deiner Frage behandeln.",
    sourceRoles: { direct: "Direkter Beleg für einen gefragten Punkt", background: "Ergänzender Kontext", limited_example: "Begrenztes Beispiel, keine allgemeine Regel" },
    failures: { summary_provider_rejection: "Die Zusammenfassung konnte nicht erstellt werden, weil der Schreibdienst die Anfrage abgelehnt hat. Geprüfte Abschnitte bleiben unten erhalten; die endgültige Antwort wurde nicht fertiggestellt.", summary_timeout: "Die Zeit für die Zusammenfassung ist abgelaufen. Geprüfte Abschnitte bleiben unten erhalten; die endgültige Antwort wurde nicht fertiggestellt.", writer_failure: "Eine Erklärung konnte nicht erstellt werden. Geprüfte Abschnitte bleiben unten erhalten; die endgültige Antwort wurde nicht fertiggestellt." },
    sourceFailures: { source_revalidation: "Die gespeicherten Quellen konnten beim Fortsetzen nicht erneut geprüft werden. Eine endgültige Antwort wurde nicht freigegeben.", evidence_selection: "Die Belegauswahl konnte nicht abgeschlossen werden. Ungeprüfte Erklärungen werden nicht angezeigt.", explanation_check: "Die Prüfung der Erklärung wurde nicht abgeschlossen. Nur zuvor geprüftes Material bleibt erhalten.", source_search: "Einige Quellensuchen konnten nicht abgeschlossen werden. Die angezeigten Belege wurden geprüft; weitere relevante Belege können fehlen.", verse_lookup: "Einige Verstexte konnten nicht abgerufen werden. Nur verfügbare und geprüfte Belege werden angezeigt.", context_lookup: "Einige umgebende Verse konnten nicht abgerufen werden. Passagen, die diesen Kontext benötigen, wurden zurückgehalten." },
    technicalFailure: "Die Recherche wurde wegen eines Verarbeitungs- oder Prüfungsfehlers beendet. Angezeigte Abschnitte haben ihre Einzelprüfungen bestanden. Es wurde keine endgültige Antwort gespeichert.",
    relatedVideoNotice: "Weiterführende Videos aus freigegebenen Kanälen, anhand des Titels ausgewählt. Die Aufnahme wurde nicht als Beleg für diese Antwort geprüft.",
    checkingPending: "Es wird nach einer noch offenen Recherche gesucht…",
    submitting: "Deine Frage wird gesendet…",
    queued: "Deine Frage wartet auf den Beginn der Recherche…",
    reconnecting: "Verbindung zur selben Recherche wird wiederhergestellt…",
    refreshing: "Die Originalquellen werden erneut geprüft…",
    stopping: "Es wird geprüft, ob die Recherche beendet wurde…",
    saving: "Die geprüfte Antwort wird gespeichert…",
    resume: "Recherche fortsetzen",
    continueResearch: "Recherche fortsetzen",
    patientNotice: "Diese Erläuterungen haben automatische Prüfungen bestanden. Die Recherche läuft weiter; die abschließende Antwort ist noch nicht fertig.",
    patientPaused: "Die Recherche ist pausiert. Die geprüften Abschnitte bleiben erhalten. Beim Fortsetzen wird die offene Arbeit in derselben Recherche wieder aufgenommen.",
    patientSummaryWaiting: "Die abschließende Zusammenfassung erscheint, sobald die erforderliche Recherche und Prüfung abgeschlossen sind.",
    patientStates: { searching: "Diese Quellengruppe wird durchsucht…", checking: "Diese Erläuterung wird geprüft…", ready: "Geprüfte Erläuterung bereit.", empty: "Aus dieser Gruppe wurde kein unmittelbar relevanter Beleg ausgewählt.", needs_attention: "Dieser Schritt muss geklärt werden, bevor die abschließende Antwort fertiggestellt werden kann." },
    reconnectFailed:
      "Die Verbindung wurde unterbrochen. Beim Fortsetzen wird dieselbe Recherche geprüft, ohne eine neue Frage zu senden.",
    cancelFailed:
      "Das Stoppen konnte nicht bestätigt werden. Bitte versuche es erneut; die Recherche läuft möglicherweise noch.",
    notRunning:
      "Die Recherche läuft nicht mehr. Es wurde keine neue Anfrage gesendet.",
    changed:
      "Diese Antwort konnte nicht erneut bestätigt werden. Ihre bisherigen Abschnitte wurden ausgeblendet. Es wurde keine neue Frage gesendet.",
    chatFull:
      "Beginne einen neuen Chat, um fortzufahren. Dieser Chat hat sein Verlaufslimit erreicht.",
    saveFailed:
      "Die Antwort ist fertig, aber der Chat konnte nicht gespeichert werden. Mit Fortsetzen kannst du das Speichern erneut versuchen, ohne eine weitere Antwort zu erzeugen.",
    scopeNotice:
      "Allgemeine Informationen aus den gezeigten Quellen. Einzelne Umstände können gesonderte Beratung erfordern.",
    aiTranslation:
      "KI-Übersetzung zur Anzeige, automatisch mit diesem Auszug abgeglichen",
    humanTranslation:
      "Menschliche Übersetzung, automatisch mit diesem Auszug abgeglichen",
    humanReviewedTranslation: "Von einem Menschen geprüfte Übersetzung",
    translationLookupFailed:
      "Die Übersetzung konnte nicht geladen werden. Der arabische Originaltext bleibt verfügbar.",
    translationNotChecked:
      "Eine mit genau diesem Auszug abgeglichene Übersetzung ist nicht verfügbar.",
    translationRejected:
      "Eine Übersetzung wurde zurückgehalten, weil ihre Übereinstimmung mit diesem Auszug nicht bestätigt werden konnte.",
    noCheckedSections:
      "Bei diesem Versuch konnte keine geprüfte Antwort erstellt werden. Es wurde nichts gespeichert.",
    nextByGuide: {
      clarify_application:
        "Welche Bedingung in der zitierten Erklärung möchtest du besser verstehen? Frage bei einem konkreten Fall einen qualifizierten Gelehrten, ohne hier Namen oder private Einzelheiten zu nennen.",
      study_evidence:
        "Öffne eine zitierte Stelle und lies ihren Zusammenhang. Du kannst fragen, wie genau sie die Antwort stützt und wo die Grenzen ihrer Aussage liegen.",
      learn_steps:
        "Lies die zitierten Schritte und Bedingungen gemeinsam. Frage nach unklaren Schritten, bevor du diese allgemeine Erklärung auf deine Umstände anwendest.",
    },
    limited:
      "Einige Quellensuchen oder Erklärungen konnten nicht abgeschlossen werden. Diese Antwort stützt sich nur auf die unten gezeigten Quellen; die fehlenden Abschnitte wurden nicht geprüft.",
    stopped:
      "Die Antwort wurde gestoppt. Es wurde kein automatischer Wiederholungsversuch gestartet.",
    checkFailure:
      "Die Antwort konnte nicht sicher angezeigt werden. Es wurde kein automatischer Wiederholungsversuch gestartet.",
    titles: {
      quran: "Aus dem Koran",
      hadith: "Aus der Sunna",
      scholar: "Erklärungen der Gelehrten",
      summary: "Bayans Zusammenfassung",
    },
    outcomes: {
      not_checked:
        "Dieser Abschnitt wurde zurückgehalten, weil keine vollständige, belegte Antwort bestätigt werden konnte.",
      no_direct_evidence:
        "Aus dieser Quellengruppe wurde kein unmittelbar passender Beleg ausgewählt. Das bedeutet nicht, dass es keinen gibt.",
      unavailable:
        "Die Suche in dieser Quelle ist nicht verfügbar. Dieser Abschnitt konnte nicht geprüft werden.",
      timeout:
        "Die Suche in dieser Quelle hat das Zeitlimit erreicht. Das beweist nicht, dass passende Belege fehlen.",
      search_failed:
        "Die Suche in dieser Quelle ist fehlgeschlagen. Ihre Belege konnten nicht geprüft werden.",
      failed_check:
        "Eine geprüfte Erklärung konnte nicht bereitgestellt werden und wird daher zurückgehalten.",
    },
    progress: {
      retrying_selection: "Die Quellen werden erneut geprüft…",
      correcting_summary: "Die Zusammenfassung wird geprüft…",
      understanding: "Deine Frage wird eingeordnet…",
      searching: "Die Quellen werden durchsucht…",
      checking_evidence: "Belege und Zusammenhang werden geprüft…",
      writing_quran: "Die Erklärungen werden vorbereitet…",
      checking_quran: "Die Koranerklärung wird geprüft…",
      checking_hadith: "Die Sunnaerklärung wird geprüft…",
      checking_scholar: "Erklärungen der Gelehrten werden geprüft…",
      finding_videos: "Optionale Lernvideos werden geprüft…",
      checking_remaining:
        "Weitere Erklärungen und die Zusammenfassung werden geprüft…",
    },
    automatic:
      "Automatisch geprüfte Antwort. Eine unabhängige Prüfung durch Gelehrte ist ein eigener Schritt.",
    incomplete:
      "Diese Antwort ist unvollständig. Die folgenden Abschnitte haben ihre Einzelprüfungen bestanden, aber es wurde kein abschließendes Ergebnis bestätigt. Die Antwort wurde nicht gespeichert.",
    withdrawn:
      "Der frühere Abschnitt wurde zurückgezogen, weil die Gesamtprüfung ihn nicht bestätigen konnte. Bitte verlasse dich nicht darauf.",
    interrupted:
      "Die Verbindung wurde vor Abschluss der Antwort unterbrochen. Es wurde keine neue Anfrage gesendet.",
    stop: "Antwort stoppen",
    source: "Quelle lesen",
    original: "Originaltext und Übersetzung",
    citedExcerpts: "Zitierte Quellenauszüge ansehen",
    missing:
      "Hier ist keine geprüfte Übersetzung verfügbar. Der arabische Originaltext steht hier.",
    guidance: "Dein nächster Schritt",
    uncovered: "Die gefundenen Quellen konnten „{label}“ nicht vollständig beantworten. Wenn du das gemeint hast, frage bitte gesondert danach.",
    next: "Stelle eine konkrete Nachfrage zum Beleg oder dazu, wie er deine Frage betrifft. Persönliche Umstände können den Rat eines qualifizierten Gelehrten erfordern.",
  },
} satisfies Record<Locale, unknown>;
