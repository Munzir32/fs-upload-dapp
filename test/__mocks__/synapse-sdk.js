module.exports = {
  Synapse: {
    create: jest.fn(async () => ({
      payments: { walletBalance: jest.fn().mockResolvedValue(BigInt(0)) },
      createStorage: jest.fn().mockResolvedValue({
        upload: jest.fn(() => ({
          commp: jest.fn().mockResolvedValue('mock-commp'),
          done: jest.fn().mockResolvedValue('0xmock')
        }))
      })
    })),
  },
};
