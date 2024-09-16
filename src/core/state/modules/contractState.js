import {
    calculateBFCAmount,
    checkIsApproved,
    getBalance,
    getTokensAccepted, sendApprove
} from "@/core/services/contractService.js";


const state = {
    web3Modal: null,
    tokensAccepted: getTokensAccepted(),  // Хранение токенов
    selectedToken: getTokensAccepted()[2],  // Выбранный токен
    selectedTokenBalance: 0,
    amount: 50.00,
    calculatedFC: 0,
    isApproved: false,
    loaderApproveTransaction: false,
    resultApproveTransaction: null,
};

const getters = {
    getTokensAccepted: state => state.tokensAccepted,
    getSelectedToken: state => state.selectedToken,
    getSelectedTokenBalance: state => state.selectedTokenBalance,
    getAmount: state => state.amount,
    getCalculatedFC: state => state.calculatedFC,
    isApproved: state => state.isApproved,
    getLoaderApproveTransaction: state => state.loaderApproveTransaction,
    getResultApproveTransaction: state => state.resultApproveTransaction,
};

const mutations = {
    setWeb3Modal(state, web3Modal) {
        state.web3Modal = web3Modal;
    },
    setSelectedToken: (state, token) => {
        state.selectedToken = token;
    },
    setSelectedTokenBalance: (state, token) => {
        state.selectedTokenBalance = token;
    },
    setAmount: (state, amount) => {
        state.amount = amount;
    },
    setIsApproved: (state, approve) => {
        state.approve = approve;
    },
    setCalculatedFC: (state, calculatedFC) => {
        state.calculatedFC = calculatedFC;
    },
    setLoaderApproveTransaction: (state, loaderApproveTransaction) => {
        state.loaderApproveTransaction = loaderApproveTransaction;
    },
    setResultApproveTransaction: (state, resultApproveTransaction) => {
        state.resultApproveTransaction = resultApproveTransaction;
    }
};

const actions = {
    updateToken({commit, state}, token) {
        commit('setSelectedToken', token);
    },
    async updateAmount({commit}, amount) {
        commit('setAmount', amount);
    },
    async calculateFC({commit, rootGetters, state}) {
        if (!state.selectedToken) return;
        const calculatedFC = await calculateBFCAmount(state.selectedToken, state.amount);
        commit('setCalculatedFC', calculatedFC);

        const walletAddress = rootGetters['master/getMaster'].userData.walletAddress;
        // Проверяем одобрено ли такое количество контракту, от этого будет зависить след шаг
        const isApproved = await checkIsApproved(state.selectedToken, walletAddress, state.amount)

        commit('setIsApproved', isApproved);
    },
    async fetchSelectedTokenBalance({commit, rootGetters}) {
        try {
            const walletAddress = rootGetters['master/getMaster'].userData.walletAddress;
            const balance = await getBalance(state.selectedToken, walletAddress);
            commit('setSelectedTokenBalance', balance);
        } catch (error) {
            console.error('Error fetching balance:', error);
        }
    },
    async fetchSendApproveTransaction({commit}) {
        try {
            commit('setLoaderApproveTransaction', true);

            const result = await sendApprove(state.selectedToken, state.amount, state.web3Modal.getWalletProvider());
            console.log(result);

            console.log("get result");
        } catch (error) {
            console.error('Error fetching balance:', error);
            commit('setLoaderApproveTransaction', false);
        }

    }
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
