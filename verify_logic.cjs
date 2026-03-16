async function run() {
    const month = '2026-03';
    console.log(`Generating payments for ${month}...`);

    const genRes = await fetch('http://localhost:3005/api/payments/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month })
    });

    const genData = await genRes.json();
    console.log('Generate Response:', genData);

    console.log('Checking student Lò Linh Anh balance...');
    const stuRes = await fetch('http://localhost:3005/api/students');
    const students = await stuRes.json();
    const student = students.find(s => s.name.includes('Lò Linh Anh'));
    console.log('Student Info:', student);

    console.log('Checking transaction history...');
    const txRes = await fetch(`http://localhost:3005/api/tx-history/${student.id}`);
    const history = await txRes.json();
    console.log('History:', history.slice(0, 2));
}

run().catch(console.error);
