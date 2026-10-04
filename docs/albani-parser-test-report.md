# Al-Albani parser test

Date: 2026-10-01

This was a dry-run test only. No database rows were written, no audio was downloaded, and no AI provider was used.

## Result

The first test checked 20 transcript pages from each of the six priority series:

| Series | Checked | Candidates | Rejected | Pass rate |
|---|---:|---:|---:|---:|
| Jeddah fatwas | 20 | 4 | 16 | 20.0% |
| Emirati fatwas | 20 | 3 | 17 | 15.0% |
| Kuwait fatwas | 20 | 4 | 16 | 20.0% |
| Rabigh fatwas | 20 | 3 | 17 | 15.0% |
| Madinah fatwas | 20 | 0 | 20 | 0.0% |
| Sifat Salat al-Nabi | 20 | 1 | 19 | 5.0% |
| **Total** | **120** | **15** | **105** | **12.5%** |

The objective says to stop and report after the first test when more than 60% of a batch is rejected at the start. This test rejected 87.5%, so collection was stopped before scaling up.

## What worked

The parser correctly extracted complete answer excerpts from pages such as:

- Jeddah: `ما حكم الزيادة في دعاء قنوت الوتر ؟`
- Emirati: `ما رأي فضيلتكم في الأناشيد والضرب عليها بالدُّفوف ؟`
- Kuwait: `هل يجوز قراءة (( ملك يوم الدين )) في سورة الفاتحة في الصلاة ؟`
- Rabigh: `من اجتمع عليه غسل جنابة وغسل جمعة ؛ فكيف يفعلهما ؟`
- Sifat Salat al-Nabi: `الحديث في الجماعة الثانية في المسجد ؟`

The saved excerpts were between 200 and 600 characters and retained the official transcript wording.

## Main failure

The current parser requires the transcript to begin with a questioner and then the Shaykh's answer. Many official pages instead begin with the Shaykh, or begin with a khutbah, a previous answer, or a continuing discussion. Examples include:

- Jeddah page 8347: the transcript opens with the khutbat al-hajah, then a question, then the answer.
- Madinah page 141649: the transcript opens with a Shaykh statement, then several questioner and Shaykh turns.
- Sifat page 142491: the transcript opens with the Shaykh answering a question that is not marked as a separate questioner turn.

These pages may contain usable material, but the current parser cannot safely prove that the first extracted answer is a complete, self-contained answer. They were therefore rejected rather than imported.

Full per-page results and excerpts are in `docs/albani-parser-test.json`.

No Al-Albani import was attempted.
