import {MAX_DECK_SIZE, MIN_DECK_SIZE} from "@/core/constants.js";

export class DeckModel {
    constructor(cards = []) {
        this.cards = cards; // array of CardModel
    }

    addCard(card) {
        if (this.cards.length >= MAX_DECK_SIZE) return false;
        if (this.cards.find(c => c.id === card.id)) return false;
        this.cards.push(card);
        return true;
    }

    removeCard(cardId) {
        const index = this.cards.findIndex(c => c.id === cardId);
        if (index === -1) return false;
        this.cards.splice(index, 1);
        return true;
    }

    hasCard(cardId) {
        return this.cards.some(c => c.id === cardId);
    }

    isValid() {
        return this.cards.length >= MIN_DECK_SIZE && this.cards.length <= MAX_DECK_SIZE;
    }

    getCardIds() {
        return this.cards.map(c => c.id);
    }

    toJSON() {
        return this.getCardIds();
    }

    static fromJSON(cardIds, allCards) {
        const cards = cardIds
            .map(id => allCards.find(c => c.id === id))
            .filter(Boolean);
        return new DeckModel(cards);
    }
}
