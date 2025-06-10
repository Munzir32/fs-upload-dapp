module.exports = {
  TOKENS: {
    USDFC: 'USDFC',
    FIL: 'FIL',
  },
  CONTRACT_ADDRESSES: {
    PANDORA_SERVICE: {
      calibration: '0xMockPandoraAddress',
    },
  },
  Synapse: {
    create: jest.fn(async () => ({
      payments: { walletBalance: jest.fn().mockResolvedValue(BigInt(0)) },
      createStorage: jest.fn().mockResolvedValue({
        preflightUpload: jest.fn().mockResolvedValue({
          estimatedCost: { perEpoch: 0n, perDay: 0n, perMonth: 0n },
          allowanceCheck: { sufficient: true, message: '' },
          selectedProvider: {},
          selectedProofSetId: 1,
        }),
        upload: jest.fn(async (data, callbacks) => {
          if (callbacks?.onUploadComplete) callbacks.onUploadComplete('mock-commp');
          if (callbacks?.onRootAdded) callbacks.onRootAdded();
          return { commp: 'mock-commp', size: data.length || 0, rootId: 1 };
        }),
      }),
    })),
  },
};
