# Al-Albani import stop report

Date: 2026-10-01

## Result

- New Al-Albani fatwas stored in this run: 42
- Total Al-Albani sources after the run: 64
- Approved search documents after the run: 64
- Existing Al-Albani sources before the run: 22
- Database errors: 0
- Transcript request errors before stopping: 1 timeout, followed by official-site timeouts
- AI providers used: none
- Audio downloaded: none

The run stopped because the official site stopped responding. The main page, Rabigh series page, and a Rabigh transcript all timed out during the final check.

## Pass rate by completed series

This is manual approvals divided by parser candidates. The second number is approvals divided by all transcript pages requested.

| Series | Candidates | Approved | Rejected | Needs Mo | Pass of candidates | Pass of requests |
|---|---:|---:|---:|---:|---:|---:|
| Jeddah fatwas | 60 | 26 | 24 | 10 | 43.3% | 3.7% |
| Emirati fatwas | 20 | 8 | 8 | 4 | 40.0% | 6.6% |
| Kuwait fatwas | 20 | 8 | 9 | 3 | 40.0% | 5.8% |
| Rabigh fatwas | 16 partial | 0 | not reviewed | not reviewed | stopped | stopped |

Madinah, Sifat Salat al-Nabi, phone and car, and Al-Huda wa al-Nur were not reached.

## Rejected items

Across the completed batches, 41 parser candidates were rejected after reading. The main reasons were:

- answer continues on another tape or refers to a previous answer
- excerpt ends mid-answer or with a new question
- room talk or greetings remain in the excerpt
- explicit ellipses or damaged transcript text
- near duplicate of an earlier candidate

The dry-run also recorded 854 mechanical rejections before manual review, mainly because the current parser could not prove a complete question and answer.

## Needs Mo

17 candidates were held back:

- Batch 001: hadith authenticity unresolved, incomplete marriage answer, and an answer where Al-Albani says he does not know the ruling
- Batch 002: silent hadith entries without their grades, an unfinished gold answer, an answer ending with a question, and hadith support without a clear grade
- Batch 003: jihad answer with unclear hadith grading, disputed Rakanah hadith, and hadith support without a clear grade
- Batch 005: unclear scope of concealing revelation, incomplete traveler prayer answer, incomplete study-method answer, and unclear hadith grading for female circumcision
- Batch 006: unclear hadith grading for the interpretation, unclear final grade for an added wording, and unclear ruling about Ammar's statement

The full candidate-level reasons are in the batch decision files in `docs/`.

## Ten stored titles for spot checking

1. ما الفرق بين العام والمطلق والخاص والمقيد ؟
2. مدى صحة الحديث الذي جاء فيه أن الميت يسمع قرع النعال ؟
3. ما حكم من يقومون بعمليات انتحارية ؛ هل يعتبرون من الشهداء ؟
4. الرأي في الواقدي والأخذ عنه عند السلفيين
5. هل يصح حديث الجبيرة ؟ وإن كان ضعيفًا فما يفعل صاحب الجبيرة ؟
6. يتهم البعض السلفيين بأنهم مهتمون فقط بقضية التوحيد
7. ما حكم زكاة عروض التجارة ؟
8. هل القراءات السبع ثبتت ؟
9. عن علي رضي الله عنه: حدثوا الناس بما يفهمون
10. إذا طلق الرجل زوجته ثلاثًا في مجلس واحد، كم يحسب؟

Every stored item keeps its official al-albany.com link. No translations or other scholars' rows were touched.
