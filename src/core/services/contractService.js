import contractABI from '@/assets/abi/abi.json'
import {ethers} from "ethers";

let provider;
let contract;

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const contractAddress = "0xda5268Ea2bA288C5CF4fe5b498193C465f1c3A0F";


// Массив токенов с адресами и количеством десятичных знаков
const tokensAccepted = [
    {name: 'Ethereum', address: ZERO_ADDRESS, decimals: 18, initialAmount: 0.050},
    {name: 'WBTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8, initialAmount: 0.002},
    {name: 'USDT (ERC20)', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, initialAmount: 50},
    {name: 'USDC (ERC20)', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, initialAmount: 50},
    {name: 'DAI (ERC20)', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18, initialAmount: 50}
];

const initializeContract = async () => {
    // RPC URL
    const rpcUrl = "https://cloudflare-eth.com";

    provider = new ethers.JsonRpcProvider(rpcUrl);
    contract = new ethers.Contract(contractAddress, contractABI, provider);
};

const getBalance = async (token, userAddress) => {
    try {
        if (!provider) {
            await initializeContract();
        }

        // Если это нативный токен Ethereum, получаем баланс напрямую от провайдера
        if (token.address === ZERO_ADDRESS) {
            const balance = await provider.getBalance(userAddress);
            return ethers.formatUnits(balance, token.decimals);
        }

        console.log(token, userAddress);

        // В противном случае получаем баланс для ERC-20 токена
        const tokenContract = new ethers.Contract(token.address,
            ['function balanceOf(address) view returns (uint)',]
            , provider);

        const balance = await tokenContract.balanceOf(userAddress);
        return ethers.formatUnits(balance, token.decimals);

    } catch (error) {
        console.error("Error fetching balance:", error);
        //throw error;
    }
};

const getApprovedAmount = async (token, userAddress) => {
    try {
        if (!provider) {
            await initializeContract();
        }

        // Если это Ethereum (нативный токен)
        if (token.address === ZERO_ADDRESS) {
            return BigInt(999999999999991); // Для Ethereum
        }

        // Создаем контракт токена ERC-20
        const tokenContract = new ethers.Contract(token.address, [
            'function allowance(address, address) view returns (uint256)',
        ], provider);

        // Получаем одобренное количество токенов
        const approvedAmount = await tokenContract.allowance(userAddress, contractAddress);

        // Преобразуем requiredAmount в нужный формат с учетом десятичных знаков
        return approvedAmount / BigInt(10 ** token.decimals);

    } catch (error) {
        console.error("Error checking approval:", error);
        //throw error;
    }
};

const sendApprove = async (token, amount, walletProvider) => {
    try {
        // Проверяем, если walletProvider доступен
        if (!walletProvider) {
            return { success: false, error: "Wallet provider is not available" };
        }

        // Используем BrowserProvider для работы с кошельком
        const provider = new ethers.BrowserProvider(walletProvider);
        const signer = await provider.getSigner();

        // Если это Ethereum, approve не требуется
        if (token.address === ZERO_ADDRESS) {
            return { success: false, error: "Its Ethereum!!!" };
        }

        const tokenContract = new ethers.Contract(token.address, [
            'function approve(address, uint256) public returns (bool)',
        ], signer);

        const adjustedAmount = ethers.parseUnits(amount.toString(), token.decimals);
        const tx = await tokenContract.approve(contractAddress, adjustedAmount);

        // Ожидаем завершения транзакции
        await tx.wait();

        console.log('Approval successful:', tx);
        return { success: true, transaction: tx };
    } catch (error) {
        //console.error("Error sending approve transaction:", error);
        const trimError = error.message.split('(')[0].trim();
        return { success: false, error: trimError };
    }
};


const sendMint = async (token, amount, payload, walletProvider) => {
    try {
        if (!walletProvider) {
            return { success: false, error: "Wallet provider is not available" };
        }

        // Инициализируем провайдера и подпись транзакции
        const provider = new ethers.BrowserProvider(walletProvider);
        const signer = await provider.getSigner();

        if (token.address === ZERO_ADDRESS) {
            const tx = await contract.connect(signer).mintFromEth(payload, {
                value: ethers.parseUnits(amount.toString(), token.decimals),
            });

            // Ожидаем завершения транзакции
            await tx.wait();

            console.log('Mint successful for ETH:', tx);
            return { success: true, transaction: tx };
        }

        // Для ERC-20 токенов
        const adjustedAmount = ethers.parseUnits(amount.toString(), token.decimals);

        const isAccepted = await contract.isTokenAccepted(token.address);
        if (!isAccepted) {
            return { success: false, error: `${token.name} is not accepted by the contract` };
        }

        const tx = await contract.connect(signer).mintFromERC20(token.address, adjustedAmount, payload);

        await tx.wait();

        console.log('Mint successful for ERC-20 token:', tx);
        return { success: true, transaction: tx };

    } catch (error) {
        //console.error("Error during mint:", error);
        const trimError = error.message.split('(')[0].trim();
        return { success: false, error: trimError };
    }
};


const calculateBFCAmount = async (token, amount) => {
    try {
        if (!contract) {
            await initializeContract();
        }

        // Преобразуем сумму в соответствии с количеством десятичных знаков токена
        const adjustedAmount = convertAmountToDecimals(amount, token.decimals);

        // Возвращаем результат вызова контракта
        const result = BigInt(await contract.calculateBFCAmount(token.address, adjustedAmount));

        const adjustedResult = result / BigInt(10 ** 6);

        // Преобразуем в обычное целое число или строку, если результат слишком большой
        return adjustedResult.toString();

    } catch (error) {
        console.error("Error while calculating BFC amount:", error);
        //throw error;
    }
};

const getTokensAccepted = () => {
    return tokensAccepted;
};

const convertAmountToDecimals = (amount, decimals) => {
    return ethers.parseUnits(amount.toString(), decimals);
};


export {initializeContract, calculateBFCAmount,
    getTokensAccepted, getBalance, getApprovedAmount, sendApprove, sendMint};
