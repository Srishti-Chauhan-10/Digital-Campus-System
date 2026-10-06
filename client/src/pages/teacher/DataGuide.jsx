import React, { useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { Field } from '../../components/ui.jsx';

function Block({ title, children, tone = 'brand' }) {
  const tones = {
    brand: 'border-brand-200',
    gold: 'border-gold-300',
    rose: 'border-rose-200',
  };
  return (
    <section className={`card card-pad border ${tones[tone]}`}>
      <h2 className="h-sub mb-2">{title}</h2>
      <div className="space-y-2.5 text-sm leading-relaxed text-brand-800">{children}</div>
    </section>
  );
}

function Code({ children }) {
  return (
    <pre className="overflow-x-auto rounded-2xl bg-brand-900 p-4 text-[12px] leading-relaxed text-kiwi">
      {children}
    </pre>
  );
}

export default function DataGuide() {
  const [tab, setTab] = useState('ui');
  const tabs = [
    { value: 'ui', label: '1. વેબસાઇટ પરથી' },
    { value: 'bulk', label: '2. જલદી (bulk)' },
    { value: 'db', label: '3. ડેટાબેઝમાં સીધું' },
    { value: 'login', label: '4. લોગઇન નિયમો' },
  ];

  return (
    <Layout role="teacher">
      <header className="mb-5">
        <h1 className="h-title">🗂️ ડેટા કેવી રીતે નાખવો</h1>
        <p className="muted mt-1">વિદ્યાર્થીનું નામ, રોલ નંબર અને ગુણ — ત્રણેય રીતે ભરી શકાય. સૌથી સરળ રીત પહેલાં.</p>
      </header>

      <div className="mb-4 max-w-3xl">
        <div className="flex flex-wrap gap-1.5 rounded-2xl bg-brand-100/70 p-1.5">
          {tabs.map((t) => (
            <button key={t.value} onClick={() => setTab(t.value)}
              className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition
                ${tab === t.value ? 'bg-white text-brand-900 shadow-sm' : 'text-brand-700 hover:bg-white/60'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'ui' && (
        <div className="space-y-4">
          <Block title="A. વિદ્યાર્થીનું નામ અને રોલ નંબર નોંધવું">
            <ol className="list-decimal space-y-1.5 pl-5">
              <li>બાઁ બાજુ <b>“👥 વિદ્યાર્થી યાદી”</b> ખોલો.</li>
              <li>ઉપર ડાબે પાસે <b>ધોરણ ૯ / ૧૦</b> પસંદ કરો.</li>
              <li><b>“+ નવો વિદ્યાર્થી”</b> દબાવીને નામ (ગુજરાતી), રોલ નંબર, પિતાનું નામ, મોબાઇલ, ગુંપ, ભવન ભરો.</li>
              <li>એક જ રોલ નંબર ફક્ત એક જ વિદ્યાર્થીનો — એ ધ્યાનમાં રાખવું.</li>
            </ol>
            <p className="rounded-xl bg-gold-100 px-3 py-2 text-xs font-bold text-brand-900">
              નોંધી દીધા પછી વિદ્યાર્થી તરત જ પોતાના રોલ નંબરથી લોગઇન કરી શકશે.
            </p>
          </Block>

          <Block title="B. ગુણ (માર્ક્સ) અપલોડ કરવા" tone="gold">
            <ol className="list-decimal space-y-1.5 pl-5">
              <li><b>“📊 ગુણ અપલોડ”</b> ખોલો.</li>
              <li>ધોરણ અને પરીક્ષા (પ્રથમ સત્રાંત / અર્ધવાર્ષિક / વાર્ષિક) પસંદ કરો.</li>
              <li>એક જ ટેબલ માં — <b>દરેક લાઇનમાં એક વિદ્યાર્થી (રોલ નં.)</b>, અને દરેક કૉલમમાં એક વિષય.</li>
              <li>ગુણ લખી <b>“💾 સાચવો”</b> દબાવો — એક જ વાર સાચવ્યા પછી ફક્ત એ જ ગુણ બદલવા પડે ત્યારે ફક્ત તે જ કૉલમ ભરો.</li>
              <li>ખાલી ખોલી રાખો તો એ વિષયનો ગુણ “ના માર્ક્સ” રહેશે.</li>
            </ol>
            <p>“📄 પરિણામ પત્ર” ટેબમાં કુલ, પ્રતિશત અને ગ્રેડ આપોઆપ દેખાશે.</p>
          </Block>

          <Block title="C. અભ્યાસક્રમ (પ્રકરણ) અપલોડ કરવા">
            <ol className="list-decimal space-y-1.5 pl-5">
              <li><b>“📚 અભ્યાસક્રમ અપલોડ”</b> ખોલો → ધોરણ પસંદ કરો.</li>
              <li>વિષય પસંદ કરી <b>“પ્રકરણ જુઓ”</b> દબાવો.</li>
              <li><b>“+ પ્રકરણ”</b> — એક એક ઉમેરો. ઘણા હોય તો <b>“📋 ઘણું એકસાથે”</b> વાપરો.</li>
            </ol>
            <p className="text-xs text-brand-700/80">GSEB ના પ્રકરણ પહેલેથી સેટ છે; તમે એમાં ઉમેરવા કે કાઢવા શકો છો.</p>
          </Block>
        </div>
      )}

      {tab === 'bulk' && (
        <div className="space-y-4">
          <Block title="ઘણા વિદ્યાર્થી એક સાથે" tone="gold">
            <p>વિદ્યાર્થી યાદી → <b>“➕ વિદ્યાર્થી ઉમેરો”</b>. એક એક કરીને ભરો :</p>
            <Code>{`1, આરવ પટેલ
2, વિહાન ચૌધરી
3, દરશ પટેલ
4, કિરણ સોલંકી`}</Code>
            <p className="text-xs">જે રોલ નંબર પહેલેથી હોય તેનું નામ <b>અપડેટ</b> થઈ જશે — આથી આ યાદી ફરી પણ ભરી શકાય.</p>
          </Block>

          <Block title="ઘણા પ્રકરણ એક સાથે">
            <p>અભ્યાસક્રમ → વિષય → <b>“📋 ઘણું એકસાથે”</b>. દરેક લાઇનમાં <code className="rounded bg-brand-100 px-1.5 py-0.5">પ્રકરણ, માસ</code> :</p>
            <Code>{`ત્રિકોણમિતિના ઉપયોગો, નવેમ્બર
વર્તુળ, ડિસેમ્બર
આંકડાશાસ્ત્ર, જાન્યુઆરી`}</Code>
          </Block>

          <Block title="ઘણા ગુણ એક સાથે" tone="gold">
            <p>ગુણ અપલોડ → <b>“📋 જલદી નિવાડી”</b>. કૉલમનો ક્રમ ટેબલની કૉલમ પ્રમાણે હોવો જોઈએ :</p>
            <Code>{`રોલ, ગુણ1, ગુણ2, ગુણ3
10, 45, 52, 38
11, 51, 47, 40`}</Code>
            <p className="text-xs">પછી એક વાર <b>“સાચવો”</b> દબાવવો.</p>
          </Block>
        </div>
      )}

      {tab === 'db' && (
        <div className="space-y-4">
          <Block title="સીધું ડેટાબેઝમાં (SQLite)">
            <p>જો તમે ટેર્મિનલથી કામ કરવા માંગતા હો, તો :</p>
            <Code>{`cd પ્રોજેક્ટ-ફોલ્ડર
node server/reseed.js      # ફક્ત એક વાર
sqlite3 data/school.db`}</Code>

            <p className="font-bold text-brand-900">વિદ્યાર્થી ઉમેરવો :</p>
            <Code>{`INSERT INTO students (std, roll_no, name_gu)
VALUES (9, 41, 'નવ વિદ્યાર્થી');`}</Code>

            <p className="font-bold text-brand-900">એકસાથે ઘણા વિદ્યાર્થી :</p>
            <Code>{`INSERT INTO students (std, roll_no, name_gu) VALUES
 (9, 41, 'નવ વિદ્યાર્થી'),
 (9, 42, 'બીજો વિદ્યાર્થી');`}</Code>

            <p className="font-bold text-brand-900">ગુણ ભરવા (એક જ વિદ્યાર્થી) :</p>
            <Code>{`INSERT INTO results (student_id, subject_id, exam, marks, max_marks)
SELECT s.id, sub.id, 'ANNUAL', 82, 100
FROM students s, subjects sub
WHERE s.std=9 AND s.roll_no=10 AND sub.std=9 AND sub.code='MATH';`}</Code>

            <p className="font-bold text-brand-900">જુઓ :</p>
            <Code>{`SELECT s.std, s.roll_no, s.name_gu, sub.name_gu, r.exam, r.marks
FROM results r
JOIN students s ON s.id = r.student_id
JOIN subjects sub ON sub.id = r.subject_id
ORDER BY s.std, s.roll_no;`}</Code>

            <p className="rounded-xl bg-gold-100 px-3 py-2 text-xs font-bold text-brand-900">
              ધ્યાન રાખો : અંગ્રેજી ચરક્ષર અક્ષરનું જૂથ છેલ્લે હોય છે — એટલે નામ <code>'...'</code> માં લખો.
            </p>
          </Block>
        </div>
      )}

      {tab === 'login' && (
        <div className="space-y-4">
          <Block title="વિદ્યાર્થી લોગઇન" tone="gold">
            <ul className="space-y-1.5">
              <li>• વિદ્યાર્થી <b>રોલ નંબર</b> અને <b>પાસવર્ડ</b> થી લોગઇન કરે છે.</li>
              <li>• ધોરણ ૯ નો પાસવર્ડ : <b>student9</b></li>
              <li>• ધોરણ ૧૦ નો પાસવર્ડ : <b>student10</b></li>
              <li>• ઉદાહરણ : રોલ ૧૦ + <b>student10</b> → ધોરણ ૧૦ નો વિદ્યાર્થી.</li>
              <li>• નામ કાઢવા માટે માત્ર યાદીમાં રોલ નંબર સાચો નોંધો એ પૂરતું છે.</li>
            </ul>
          </Block>

          <Block title="શિક્ષક લોગઇન (ફક્ત ૩ નંબર)">
            <div className="overflow-hidden rounded-2xl border border-brand-200">
              <table className="w-full text-sm">
                <thead><tr className="bg-brand-50 text-left">
                  <th className="px-3 py-2 font-extrabold text-brand-800">નામ</th>
                  <th className="px-3 py-2 font-extrabold text-brand-800">મોબાઇલ</th>
                </tr></thead>
                <tbody className="divide-y divide-brand-100">
                  {[['સમીર સાહેબ', '9427518906'], ['સંગીતા મેડમ', '6352866818'], ['વિનય સાહેબ', '9428687041']]
                    .map(([n, p]) => (
                      <tr key={p}><td className="px-3 py-2 font-semibold text-brand-900">{n}</td>
                        <td className="px-3 py-2 tracking-wider text-brand-800">{p}</td></tr>
                    ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs">પાસવર્ડ : <b>teacher</b> (જો બદલવો હોય તો <code className="rounded bg-brand-100 px-1.5 py-0.5">UPDATE teachers SET password='...' WHERE phone='...';</code> )</p>
          </Block>

          <Block title="હેલ્પલાઇન" tone="rose">
            <p>વિદ્યાર્થી મને શ્રેણી : સૌથી પહેલાં ઈમર્જન્સી (112, 100, 101, 108), પછી મહિલા/બાળ હેલ્પલાઇન, અને છેલ્લે શાળાના ત્રણ નંબર — તમારા શિક્ષક શરીરે સીધા વિદ્યાર્થીને મદદ કરી શકે છે.</p>
          </Block>
        </div>
      )}
    </Layout>
  );
}
