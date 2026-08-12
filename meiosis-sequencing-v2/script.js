/* ===================================
   MEIOSIS SEQUENCING INTERACTIVE
   JavaScript Functionality
   Baker Center for Children & Families
   =================================== */

// State management
let selectedCard = null;
let currentHintStage = 0;

// Correct sequence for validation (11 stages now)
const correctSequence = [
    'stage1', 'stage2', 'stage3', 'stage4', 'stage5', 'stage6',
    'stage7', 'stage8', 'stage9', 'stage10', 'stage11'
];

// Hints for each stage - short and clear
const hints = [
    "Start here: DNA gets copied. One cell prepares.",
    "Chromosomes pair up and swap pieces.",
    "Chromosome pairs line up at the center.",
    "Pairs get pulled to opposite sides.",
    "Chromosomes reach the ends.",
    "Cell splits in two!",
    "Two cells prepare for round 2.",
    "Chromosomes line up at center in each cell.",
    "Chromosomes split apart in each cell.",
    "Chromosomes reach the ends in each cell.",
    "Cells split again! Now you have 4 cells."
];

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    shuffleStages();
    setupDragAndDrop();
    setupClickToPlace();
    setupKeyboardNavigation();
    setupButtons();
    addAriaLabels();
});

// Shuffle the stage cards randomly
function shuffleStages() {
    const bank = document.getElementById('stagesBank');
    const cards = Array.from(bank.children);
    
    // Fisher-Yates shuffle
    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        bank.appendChild(cards[j]);
    }
}

// ===== DRAG AND DROP FUNCTIONALITY =====
function setupDragAndDrop() {
    const cards = document.querySelectorAll('.stage-card');
    const dropZones = document.querySelectorAll('.drop-zone');
    const stagesBank = document.getElementById('stagesBank');
    
    // Make cards draggable
    cards.forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
    });
    
    // Make drop zones receptive
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', handleDragOver);
        zone.addEventListener('dragenter', handleDragEnter);
        zone.addEventListener('dragleave', handleDragLeave);
        zone.addEventListener('drop', handleDrop);
    });
    
    // Make stages bank also accept drops (to return cards)
    if (stagesBank) {
        stagesBank.addEventListener('dragover', handleDragOver);
        stagesBank.addEventListener('dragenter', handleBankDragEnter);
        stagesBank.addEventListener('dragleave', handleBankDragLeave);
        stagesBank.addEventListener('drop', handleBankDrop);
    }
}

function handleDragStart(e) {
    // Allow dragging all cards - both in bank and placed cards
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.stage);
    
    // Set drag image
    if (e.dataTransfer.setDragImage) {
        e.dataTransfer.setDragImage(this, this.offsetWidth / 2, this.offsetHeight / 2);
    }
    
    // Clear any selected card (for click-to-place mode)
    if (selectedCard) {
        selectedCard.classList.remove('selected');
        selectedCard = null;
    }
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    this.classList.add('drag-over');
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    if (e.preventDefault) {
        e.preventDefault();
    }
    
    this.classList.remove('drag-over');
    
    const stageId = e.dataTransfer.getData('text/plain');
    const card = document.querySelector(`[data-stage="${stageId}"]`);
    
    if (card) {
        placeCard(card, this);
    }
    
    return false;
}

// ===== BANK DROP HANDLERS =====
function handleBankDragEnter(e) {
    this.style.backgroundColor = '#e8f4f8';
}

function handleBankDragLeave(e) {
    this.style.backgroundColor = '';
}

function handleBankDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    if (e.preventDefault) {
        e.preventDefault();
    }
    
    this.style.backgroundColor = '';
    
    const stageId = e.dataTransfer.getData('text/plain');
    const card = document.querySelector(`[data-stage="${stageId}"]`);
    
    if (card) {
        returnCardToBank(card);
        
        // Clean up old parent zone if card came from a drop zone
        const oldParent = card.parentElement;
        if (oldParent && oldParent.classList && oldParent.classList.contains('drop-zone')) {
            oldParent.classList.remove('filled');
        }
    }
    
    return false;
}

// ===== CLICK TO PLACE FUNCTIONALITY =====
function setupClickToPlace() {
    const cards = document.querySelectorAll('.stage-card');
    const dropZones = document.querySelectorAll('.drop-zone');
    
    cards.forEach(card => {
        card.addEventListener('click', handleCardClick);
    });
    
    dropZones.forEach(zone => {
        zone.addEventListener('click', handleZoneClick);
    });
}

function handleCardClick(e) {
    // If card is placed, allow drag but clicking will select it to move
    // (This gives users flexibility)
    
    // Deselect previous card
    if (selectedCard) {
        selectedCard.classList.remove('selected');
    }
    
    // Select this card
    if (selectedCard === this) {
        selectedCard = null;
    } else {
        selectedCard = this;
        this.classList.add('selected');
    }
}

function handleZoneClick(e) {
    if (!selectedCard) return;
    
    placeCard(selectedCard, this);
    selectedCard.classList.remove('selected');
    selectedCard = null;
}

// ===== CARD PLACEMENT LOGIC =====
function placeCard(card, zone) {
    // Check if card is coming from another drop zone
    const oldParent = card.parentElement;
    const wasInDropZone = oldParent && oldParent.classList.contains('drop-zone');
    
    // If zone already has a card, return it to the bank
    const existingCard = zone.querySelector('.stage-card');
    if (existingCard && existingCard !== card) {
        returnCardToBank(existingCard);
    }
    
    // Clean up old parent zone if card came from a drop zone
    if (wasInDropZone) {
        oldParent.classList.remove('filled');
    }
    
    // Place the new card
    zone.appendChild(card);
    zone.classList.add('filled');
    card.classList.add('placed');
    card.classList.remove('selected');
    
    // Keep draggable so users can rearrange
    card.setAttribute('draggable', 'true');
    
    // Clear feedback when student makes a change
    hideFeedback();
    
    // Clear any error/success states
    document.querySelectorAll('.drop-zone').forEach(z => {
        z.classList.remove('correct', 'incorrect');
    });
}

function returnCardToBank(card) {
    const bank = document.getElementById('stagesBank');
    bank.appendChild(card);
    card.classList.remove('placed');
    card.setAttribute('draggable', 'true');
}

// ===== KEYBOARD NAVIGATION =====
function setupKeyboardNavigation() {
    const cards = document.querySelectorAll('.stage-card');
    
    cards.forEach(card => {
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardClick.call(card, e);
            }
        });
    });
    
    const dropZones = document.querySelectorAll('.drop-zone');
    dropZones.forEach(zone => {
        zone.setAttribute('tabindex', '0');
        zone.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleZoneClick.call(zone, e);
            }
        });
    });
}

// ===== BUTTON FUNCTIONALITY =====
function setupButtons() {
    document.getElementById('checkBtn').addEventListener('click', checkAnswer);
    document.getElementById('hintBtn').addEventListener('click', showHint);
    document.getElementById('resetBtn').addEventListener('click', resetActivity);
    document.getElementById('showAnswerBtn').addEventListener('click', showAnswer);
    document.getElementById('toggleLabelsBtn').addEventListener('click', toggleLabels);
}

// ===== TOGGLE LABELS =====
let labelsVisible = true;

function toggleLabels() {
    const labels = document.querySelectorAll('.stage-label');
    const button = document.getElementById('toggleLabelsBtn');
    
    labelsVisible = !labelsVisible;
    
    labels.forEach(label => {
        if (labelsVisible) {
            label.classList.remove('hidden-label');
        } else {
            label.classList.add('hidden-label');
        }
    });
    
    button.textContent = labelsVisible ? 'Hide Labels' : 'Show Labels';
    
    if (!labelsVisible) {
        showFeedback('Labels hidden. Look at the pictures.', 'hint');
        setTimeout(hideFeedback, 2000);
    }
}

function checkAnswer() {
    const dropZones = document.querySelectorAll('.drop-zone');
    let allCorrect = true;
    let allFilled = true;
    
    dropZones.forEach((zone, index) => {
        const card = zone.querySelector('.stage-card');
        
        if (!card) {
            allFilled = false;
            return;
        }
        
        const correctStage = zone.dataset.correct;
        const placedStage = card.dataset.stage;
        
        if (placedStage === correctStage) {
            zone.classList.add('correct');
            zone.classList.remove('incorrect');
        } else {
            zone.classList.add('incorrect');
            zone.classList.remove('correct');
            allCorrect = false;
        }
    });
    
    // Show feedback
    if (!allFilled) {
        showFeedback('Place all stages first.', 'hint');
    } else if (allCorrect) {
        showFeedback('🎉 Perfect! All stages are correct!', 'correct');
        celebrateSuccess();
    } else {
        showFeedback('Not quite. Red boxes need fixing.', 'incorrect');
    }
}

function showHint() {
    const dropZones = document.querySelectorAll('.drop-zone');
    let firstEmptyIndex = -1;
    
    // Find first empty slot
    for (let i = 0; i < dropZones.length; i++) {
        if (!dropZones[i].querySelector('.stage-card')) {
            firstEmptyIndex = i;
            break;
        }
    }
    
    // If all filled, find first incorrect slot
    if (firstEmptyIndex === -1) {
        for (let i = 0; i < dropZones.length; i++) {
            const card = dropZones[i].querySelector('.stage-card');
            if (card && card.dataset.stage !== dropZones[i].dataset.correct) {
                firstEmptyIndex = i;
                break;
            }
        }
    }
    
    if (firstEmptyIndex !== -1) {
        showFeedback(`Hint for position ${firstEmptyIndex + 1}: ${hints[firstEmptyIndex]}`, 'hint');
    } else {
        showFeedback('You\'re all done! Click "Check My Answer" to see how you did.', 'hint');
    }
}

function resetActivity() {
    const dropZones = document.querySelectorAll('.drop-zone');
    const bank = document.getElementById('stagesBank');
    
    // Return all cards to bank
    dropZones.forEach(zone => {
        const card = zone.querySelector('.stage-card');
        if (card) {
            returnCardToBank(card);
        }
        zone.classList.remove('filled', 'correct', 'incorrect');
    });
    
    // Clear selection
    if (selectedCard) {
        selectedCard.classList.remove('selected');
        selectedCard = null;
    }
    
    // Shuffle again
    shuffleStages();
    
    // Clear feedback
    hideFeedback();
    
    showFeedback('Reset! Try again.', 'hint');
    setTimeout(hideFeedback, 2000);
}

function showAnswer() {
    const confirmed = confirm('This will show you the correct answer. Are you sure you want to see it?');
    
    if (!confirmed) return;
    
    const dropZones = document.querySelectorAll('.drop-zone');
    const bank = document.getElementById('stagesBank');
    
    // Clear all zones first
    dropZones.forEach(zone => {
        const card = zone.querySelector('.stage-card');
        if (card) {
            returnCardToBank(card);
        }
        zone.classList.remove('filled', 'incorrect');
    });
    
    // Place cards in correct order
    dropZones.forEach((zone, index) => {
        const correctStage = correctSequence[index];
        const card = document.querySelector(`[data-stage="${correctStage}"]`);
        
        zone.appendChild(card);
        zone.classList.add('filled', 'correct');
        card.classList.add('placed');
        card.setAttribute('draggable', 'false');
    });
    
    showFeedback('Correct order shown! 1 cell → 2 cells → 4 cells.', 'correct');
}

// ===== FEEDBACK DISPLAY =====
function showFeedback(message, type) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = message;
    feedback.className = `feedback ${type}`;
    feedback.classList.remove('hidden');
    
    // Announce to screen readers
    feedback.setAttribute('role', 'alert');
    feedback.setAttribute('aria-live', 'polite');
}

function hideFeedback() {
    const feedback = document.getElementById('feedback');
    feedback.classList.add('hidden');
}

// ===== SUCCESS CELEBRATION =====
function celebrateSuccess() {
    // Add a subtle celebration animation
    const container = document.querySelector('.container');
    container.style.animation = 'none';
    setTimeout(() => {
        container.style.animation = 'pulse 0.5s ease';
    }, 10);
    
    // Remove animation after it completes
    setTimeout(() => {
        container.style.animation = '';
    }, 500);
}

// Add pulse animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
    }
`;
document.head.appendChild(style);

// ===== ACCESSIBILITY =====
function addAriaLabels() {
    const dropZones = document.querySelectorAll('.drop-zone');
    dropZones.forEach((zone, index) => {
        zone.setAttribute('aria-label', `Drop zone ${index + 1} for meiosis stage`);
        zone.setAttribute('role', 'button');
    });
    
    const cards = document.querySelectorAll('.stage-card');
    cards.forEach(card => {
        const label = card.querySelector('.stage-label').textContent;
        card.setAttribute('aria-label', `Meiosis stage: ${label}. Click to select, then click a drop zone to place.`);
        card.setAttribute('role', 'button');
    });
}

// ===== SAVE PROGRESS (Optional - Local Storage) =====
function saveProgress() {
    const dropZones = document.querySelectorAll('.drop-zone');
    const state = [];
    
    dropZones.forEach(zone => {
        const card = zone.querySelector('.stage-card');
        state.push(card ? card.dataset.stage : null);
    });
    
    localStorage.setItem('meiosisProgress', JSON.stringify(state));
}

function loadProgress() {
    const saved = localStorage.getItem('meiosisProgress');
    if (!saved) return;
    
    const state = JSON.parse(saved);
    const dropZones = document.querySelectorAll('.drop-zone');
    
    state.forEach((stageId, index) => {
        if (stageId) {
            const card = document.querySelector(`[data-stage="${stageId}"]`);
            placeCard(card, dropZones[index]);
        }
    });
}

// Auto-save every time a card is placed
document.addEventListener('DOMNodeInserted', (e) => {
    if (e.target.classList && e.target.classList.contains('stage-card')) {
        saveProgress();
    }
});
