import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import _HashMap "mo:base/HashMap";  // Renamed to _ since unused
import _Iter "mo:base/Iter";       // Renamed to _ since unused
import LLM "mo:llm";
import Nat "mo:base/Nat";
import _Option "mo:base/Option";    // Renamed to _ since unused
import Principal "mo:base/Principal";
import _Result "mo:base/Result";    // Renamed to _ since unused
import Time "mo:base/Time";
import Error "mo:base/Error";
import Float "mo:base/Float";

shared ({ caller = owner }) actor class Quantumic() = this {
  // Types
  public type Asset = {
    #BTC;
    #ETH;
    #ICP;
    #SOL;
    #USDT;
  };

  public type TradeDirection = {
    #BUY;
    #SELL;
  };

  public type Trade = {
    asset : Asset;
    direction : TradeDirection;
    amount : Float;
    price : Float;
    timestamp : Int;
    reason : Text;
  };

  public type Strategy = {
    #TrendFollowing;
    #MeanReversion;
    #Arbitrage;
    #SentimentAnalysis;
  };

  public type MarketData = {
    asset : Asset;
    price : Float;
    volume : Float;
    timestamp : Int;
    change24h : Float;
  };

  public type Portfolio = {
    balances : [(Asset, Float)];
    totalValue : Float;
  };

  // State
  stable var trades : [Trade] = [];
  stable var marketData : [MarketData] = [];
  stable var strategies : [Strategy] = [#TrendFollowing, #MeanReversion];
  stable var portfolio : Portfolio = {
    balances = [
      (#BTC, 0.0),
      (#ETH, 0.0),
      (#ICP, 10.0),
      (#SOL, 0.0),
      (#USDT, 1000.0)
    ];
    totalValue = 0.0;
  };

  // AI Chat Interface
  public func prompt(prompt : Text) : async Text {
    await LLM.prompt(#Llama3_1_8B, prompt);
  };

  public func chat(messages : [LLM.ChatMessage]) : async Text {
    await LLM.chat(#Llama3_1_8B, messages);
  };

  // Trading Functions
  public func analyzeMarket() : async [MarketData] {
    let mockData : [MarketData] = [
      {
        asset = #BTC;
        price = 50000.0;
        volume = 1000000.0;
        timestamp = Time.now();
        change24h = 2.5;
      },
      {
        asset = #ETH;
        price = 3000.0;
        volume = 500000.0;
        timestamp = Time.now();
        change24h = -1.2;
      },
      {
        asset = #ICP;
        price = 10.5;
        volume = 100000.0;
        timestamp = Time.now();
        change24h = 5.0;
      },
      {
        asset = #SOL;
        price = 150.0;
        volume = 200000.0;
        timestamp = Time.now();
        change24h = 3.7;
      },
      {
        asset = #USDT;
        price = 1.0;
        volume = 0.0;
        timestamp = Time.now();
        change24h = 0.0;
      }
    ];
    marketData := mockData;
    mockData;
  };

  public func executeTrade(asset : Asset, direction : TradeDirection, amount : Float) : async Trade {
    let price = switch (asset) {
      case (#BTC) { 50000.0 };
      case (#ETH) { 3000.0 };
      case (#ICP) { 10.5 };
      case (#SOL) { 150.0 };
      case (#USDT) { 1.0 };
    };

    let reason = await generateTradeReason(asset, direction, amount, price);

    let trade : Trade = {
      asset;
      direction;
      amount;
      price;
      timestamp = Time.now();
      reason;
    };

    trades := Array.append(trades, [trade]);
    updatePortfolio(trade);
    trade;
  };

  func updatePortfolio(trade : Trade) {
    let newBalances = Buffer.Buffer<(Asset, Float)>(portfolio.balances.size());
    for (balance in portfolio.balances.vals()) {
      newBalances.add(balance);
    };

    func findAssetIndex(asset : Asset) : ?Nat {
      var index : Nat = 0;
      for ((a, _) in portfolio.balances.vals()) {
        if (a == asset) {
          return ?index;
        };
        index += 1;
      };
      null;
    };

    let usdtIndex = findAssetIndex(#USDT);
    let assetIndex = findAssetIndex(trade.asset);

    switch (trade.direction) {
      case (#BUY) {
        switch (usdtIndex, assetIndex) {
          case (?uIdx, ?aIdx) {
            let (_, usdtBal) = newBalances.get(uIdx);
            let (_, assetBal) = newBalances.get(aIdx);
            newBalances.put(uIdx, (#USDT, usdtBal - (trade.amount * trade.price)));
            newBalances.put(aIdx, (trade.asset, assetBal + trade.amount));
          };
          case (_, _) {};
        };
      };
      case (#SELL) {
        switch (usdtIndex, assetIndex) {
          case (?uIdx, ?aIdx) {
            let (_, usdtBal) = newBalances.get(uIdx);
            let (_, assetBal) = newBalances.get(aIdx);
            newBalances.put(uIdx, (#USDT, usdtBal + (trade.amount * trade.price)));
            newBalances.put(aIdx, (trade.asset, assetBal - trade.amount));
          };
          case (_, _) {};
        };
      };
    };

    let totalValue = calculatePortfolioValue(Buffer.toArray(newBalances));
    
    portfolio := {
      balances = Buffer.toArray(newBalances);
      totalValue;
    };
  };

  func calculatePortfolioValue(balances : [(Asset, Float)]) : Float {
    var total : Float = 0.0;
    
    for ((asset, amount) in balances.vals()) {
      let price = switch (asset) {
        case (#BTC) { 50000.0 };
        case (#ETH) { 3000.0 };
        case (#ICP) { 10.5 };
        case (#SOL) { 150.0 };
        case (#USDT) { 1.0 };
      };
      total += amount * price;
    };
    
    total;
  };

  public func getPortfolio() : async Portfolio {
    let totalValue = calculatePortfolioValue(portfolio.balances);
    { balances = portfolio.balances; totalValue };
  };

  public func getTradeHistory() : async [Trade] {
    trades;
  };

  public func getMarketData() : async [MarketData] {
    marketData;
  };

  func generateTradeReason(asset : Asset, direction : TradeDirection, amount : Float, price : Float) : async Text {
    let prompt = "Explain in one sentence why we should " # 
      (switch (direction) {
        case (#BUY) { "buy " };
        case (#SELL) { "sell " };
      }) # 
      Float.toText(amount) # " " #
      (switch (asset) {
        case (#BTC) { "Bitcoin" };
        case (#ETH) { "Ethereum" };
        case (#ICP) { "ICP" };
        case (#SOL) { "Solana" };
        case (#USDT) { "USDT" };
      }) # " at $" # Float.toText(price) # " based on current market conditions.";

    await LLM.prompt(#Llama3_1_8B, prompt);
  };

  public func autoTrade() : async Trade {
    let currentMarket = await analyzeMarket();
    
    let icpData = Array.find(currentMarket, func (d : MarketData) : Bool { d.asset == #ICP });
    let icp = switch (icpData) {
      case (?data) { data };
      case null { return await executeTrade(#ICP, #BUY, 0.0); };
    };
    
    let (direction, amount) = if (icp.change24h > 0.0) {
      (#BUY, 1.0);
    } else {
      (#SELL, 1.0);
    };
    
    await executeTrade(#ICP, direction, amount);
  };

  public shared ({ caller }) func resetPortfolio() : async () {
    if (Principal.notEqual(caller, owner)) {
      throw Error.reject("Unauthorized");
    };
    
    portfolio := {
      balances = [
        (#BTC, 0.0),
        (#ETH, 0.0),
        (#ICP, 10.0),
        (#SOL, 0.0),
        (#USDT, 1000.0)
      ];
      totalValue = calculatePortfolioValue([
        (#BTC, 0.0),
        (#ETH, 0.0),
        (#ICP, 10.0),
        (#SOL, 0.0),
        (#USDT, 1000.0)
      ]);
    };
    trades := [];
  };

  public func getStrategies() : async [Strategy] {
    strategies;
  };

  public func addStrategy(strategy : Strategy) : async () {
    strategies := Array.append(strategies, [strategy]);
  };
};