import {
    calculateBFCAmount,
    getApprovedAmount,
    getBalance,
    getTokensAccepted, sendApprove, sendMint
} from "@/core/services/contractService.js";
import {InfoMessageModel} from "@/core/models/internal/infoMessageModel.js";



const state = {
    web3Modal: null,
    tokensAccepted: getTokensAccepted(),  // Хранение токенов
    selectedToken: getTokensAccepted()[2],  // Выбранный токен
    selectedTokenBalance: 0,
    amount: 50.00,
    calculatedFC: 0,
    approvedAmount: 0,
    loaderApproveTransaction: false,
    loaderPurchaseTransaction: false,
    transactionError: null,
    transactionSuccess: false,
};

const getters = {
    getTokensAccepted: state => state.tokensAccepted,
    getSelectedToken: state => state.selectedToken,
    getSelectedTokenBalance: state => state.selectedTokenBalance,
    getAmount: state => state.amount,
    getCalculatedFC: state => state.calculatedFC,
    getApprovedAmount: state => state.approvedAmount,
    getLoaderApproveTransaction: state => state.loaderApproveTransaction,
    getLoaderPurchaseTransaction: state => state.loaderPurchaseTransaction,
    getTransactionError: state => state.transactionError,
    getTransactionSuccess: state => state.transactionSuccess,
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
    setApprovedAmount: (state, approve) => {
        state.approvedAmount = approve;
    },
    setCalculatedFC: (state, calculatedFC) => {
        state.calculatedFC = calculatedFC;
    },
    setLoaderApproveTransaction: (state, loaderApproveTransaction) => {
        state.loaderApproveTransaction = loaderApproveTransaction;
    },
    setLoaderPurchaseTransaction: (state, loaderPurchaseTransaction) => {
        state.loaderPurchaseTransaction = loaderPurchaseTransaction;
    },
    setTransactionError: (state, error) => {
        state.transactionError = error;
    },
    setTransactionSuccess: (state, success) => {
        state.transactionSuccess = success;
    },
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

        commit('setTransactionError', null);

        const calculatedFC = await calculateBFCAmount(state.selectedToken, state.amount);
        commit('setCalculatedFC', calculatedFC);

        const walletAddress = rootGetters['master/getMaster'].userData.walletAddress;
        // Проверяем одобрено ли такое количество контракту, от этого будет зависить след шаг
        const approvedAmount = await getApprovedAmount(state.selectedToken, walletAddress, state.amount)

        commit('setApprovedAmount', approvedAmount);
    },
    async fetchSelectedTokenBalance({commit, rootGetters}) {
        try {
            const walletAddress = rootGetters['master/getMaster'].userData.walletAddress;
            console.log("WALLET_ADDRESS:", walletAddress);
            const balance = await getBalance(state.selectedToken, walletAddress);
            commit('setSelectedTokenBalance', balance);
        } catch (error) {
            console.error('Error fetching balance:', error);
        }
    },
    async fetchSendApproveTransaction({commit, dispatch}) {
        try {
            commit('setTransactionError', null);
            commit('setLoaderApproveTransaction', true);

            const result = await sendApprove(state.selectedToken, state.amount, state.web3Modal.getWalletProvider());

            // Проверяем успешность транзакции
            if (!result.success) {
                // Записываем ошибку в state, если транзакция неуспешна
                commit('setTransactionError', result.error);
                commit('setLoaderApproveTransaction', false);
                return;
            }

            console.log('Approval succeeded:', result.transaction);

            // Выключаем индикатор загрузки для approve
            commit('setLoaderApproveTransaction', false);

            // После успешного approve, вызываем транзакцию покупки
            await dispatch('fetchSendPurchaseTransaction');

        } catch (error) {
            console.error('Error during approval transaction:', error);
            commit('setTransactionError', error.message);
            commit('setLoaderApproveTransaction', false);
        }
    },
    async fetchSendPurchaseTransaction({commit, rootGetters}) {
        try {
            commit('setTransactionError', null);
            commit('setLoaderPurchaseTransaction', true);

            const id = rootGetters['master/getMaster'].userData.id;

            // Отправляем транзакцию mint
            const result = await sendMint(state.selectedToken, state.amount, id.toString(), state.web3Modal.getWalletProvider());

            // Проверяем успешность транзакции
            if (!result.success) {
                // Записываем ошибку в state, если транзакция неуспешна
                commit('setTransactionError', result.error);
                commit('setLoaderPurchaseTransaction', false);
                return;
            }

            console.log('Purchase succeeded:', result.transaction);

            // Выключаем индикатор загрузки для покупки
            commit('setLoaderPurchaseTransaction', false);

            commit('setTransactionSuccess', true);

        } catch (error) {
            // Ловим ошибки и записываем их в state
            console.error('Error during purchase transaction:', error);
            commit('setTransactionError', error.message + '\n' + t('profile.wallet.checkLimits'));
            commit('setLoaderPurchaseTransaction', false);
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
