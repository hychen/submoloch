# SubMoloch

The [Polkadot](https://polkadot.network/) version of [MolochDao]([https://github.com/MolochVentures/moloch). 
Developed for the purpose of learning, please use it at your own risk

## Setup

### Installing Node.js
We require node >=12.0, if not, you can go to the nodejs website and find out how to install or upgrade.
Or we recommend that you install Node using nvm. Windows users can use nvm-windows instead.

### Substrate Prerequisites
Follow the official installation steps from the Substrate Developer Hub Knowledge Base.
```
rustup component add rust-src --toolchain nightly
rustup target add wasm32-unknown-unknown --toolchain nightly
```
### Installing The Patract Node

We use [Patract Node](https://github.com/patractlabs/patract) as our contract test chain.
It has some very convenient optimizations for contracts, such as reducing out-of-block time. To install Patract Node:

```
$ cargo install patract-prep --git https://github.com/patractlabs/patract --locked --force
```

### Run a local node
```
patract-prep --dev --execution=Native --tmp
```

### Compile
```
npx redspot compile
```

### Test
```
npx redspot test --no-compile
```

### Deploy 
```
npx redspot run scripts/submoloch.deploy.ts --no-compile
```

