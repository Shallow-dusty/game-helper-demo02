
// Mock data
const ROLES: any = {
    'poisoner': { id: 'poisoner', name: 'Poisoner', team: 'MINION' },
    'spy': { id: 'spy', name: 'Spy', team: 'MINION' },
    'baron': { id: 'baron', name: 'Baron', team: 'MINION' },
    'scarlet_woman': { id: 'scarlet_woman', name: 'Scarlet Woman', team: 'MINION' },
    'witch': { id: 'witch', name: 'Witch', team: 'MINION' },
};

const strategy = {
    guidelines: {
        recommendedMinions: ['poisoner', 'spy', 'baron'],
        recommendedOutsiders: []
    }
};

const composition = {
    minion: 1
};

const minionRoles = ['poisoner', 'spy', 'baron', 'scarlet_woman', 'witch'];

// Helper function
const shuffleArray = <T>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5);

function selectMinion() {
    // THE FIX: recommendedMinionIds IS shuffled
    const recommendedMinionIds = shuffleArray(strategy.guidelines.recommendedMinions.filter(id => minionRoles.includes(id)));
    const otherMinionIds = minionRoles.filter(id => !recommendedMinionIds.includes(id));
    
    const minionPool = [...recommendedMinionIds, ...shuffleArray(otherMinionIds)];
    
    const selectedMinion = minionPool
        .slice(0, composition.minion)
        .map(id => ROLES[id]);
        
    return selectedMinion[0].name;
}

console.log("Running 10 trials...");
const results: string[] = [];
for (let i = 0; i < 10; i++) {
    results.push(selectMinion());
}

console.log("Results:", results);

const uniqueResults = new Set(results);
if (uniqueResults.size === 1 && results[0] === 'Poisoner') {
    console.log("BUG REPRODUCED: Always selected Poisoner (the first recommended minion).");
} else {
    console.log("Bug not reproduced or behavior is different.");
}
