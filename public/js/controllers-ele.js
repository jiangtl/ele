var app = angular.module("EleApp", []);
app.factory("base", function(){
  var promotionList = [{
    full_price : 15, cheap_price : 4
  },{
    full_price : 20, cheap_price : 5
  },{
    full_price : 20, cheap_price : 7
  },{
    full_price : 30, cheap_price : 7
  },{
    full_price : 30, cheap_price : 9
  },{
    full_price : 40, cheap_price : 15
  },{
    full_price : 50, cheap_price : 17
  }];
  //深度拷贝
  var deepCopy = function(source) { 
    var arr = [];
    for(var i = 0; i<source.length; i++){
      if(source[i] instanceof Array){
        arr[i] = arguments.callee(source[i]);
      }else{
        arr[i] = source[i];
      }
    }
    return arr;
  }

  var  base = {
    //全分组结果
    res : [],
    //各单品金额
    list : [],
    setList : function(list) {
      this.res = [];
      if(list instanceof Array) {
        this.list = list.concat();
      }
      return this;
    },
    getResult : function() {
      return this.res;
    },
    //满减活动
    getPromotionList : function() {
      return promotionList.concat();
    },
    //分裂组合
    combin : function(index) {
      var newRes = deepCopy(this.res);
      this.res = [];
      var data = this.list[index];
      if(newRes.length > 0 ){
        for(var i=0; i< newRes.length; i++){          
          var arr = deepCopy(newRes[i]);
          arr.push([data]);
          this.res.push(arr);
          var oldArr = deepCopy(newRes[i]);
          for(var j = 0; j< oldArr.length; j++){
            var itemTem = deepCopy(newRes[i]);
            itemTem[j].push(data);
            this.res.push(itemTem);
          }                         
        }     
      }else{
        this.res.push([[data]]);
      }
    },
    //匹配优惠
    matchPromo : function(list, promoList) {
      var arr = [];
      for(var i=0; i<list.length; i++) {
        var realOrder = [];
        var orders = list[i];
        for(var j=0; j<orders.length; j++) {
          var order = orders[j];
          var promotion = this.getProm(order, promoList);
          var item = {
            num : order.join("、"),          
            hbprice : 0,//红包
            count : promotion.count,
            sum :  promotion.sum,
            prom : promotion.full,
            cheap : promotion.cheap
          }
          realOrder.push(item);
        }
        arr.push(realOrder);
      }
      return arr;
    },
    getProm : function(order, plist) {
      var sum = 0, count = 0;    
      var num = 0;
      if(!order instanceof Array) {
        return;
      }
      if(order.length > 0) {
        for(var j=0; j<order.length; j++) {
          sum += parseFloat(order[j]);
          count += 1;
        }
      } else {
        sum += parseFloat(order[0]);
        count += 1;
      }
      
      //console.log(arguments, sum);
      for(var i=0; i<plist.length; i++) {
        if(sum >= plist[i].full_price) {
          return {
            count : count,
            sum : sum,
            full : plist[i].full_price,
            cheap : plist[i].cheap_price
          }
        }
      }
      return {
        count : 1,
        sum : sum,
        full : 0,
        cheap: 0
      };
    },
    //遍历&计算
    compute : function() {
      for(var i = 0; i < this.list.length; i++){
        this.combin(i);
      }
    }
  }



  return base;
})

app.controller("EleCtrl", function($scope, base) {
  $scope.price = "";
  $scope.total_price = 0;
  $scope.full_price = "";
  $scope.cheap_price = "";
  $scope.cash_coupon = "";//红包（代金券）
  $scope.total_cash_coupon = 0;//红包总和
  $scope.person_list = [];
  $scope.price_list = [];
  $scope.promotion_list = [];
  $scope.cash_coupon_list = [];
  $scope.solution = [];//解决方案
  $scope.init_promotion_list = base.getPromotionList();

  $scope.addPrice = function(p) {
    if(isNaN($scope.price) || isNaN(p) || p <= 0) {
      return;
    }
    if($scope.price_list.length > 8) {
      alert("计算量过大，不能在选了！");
      return;
    }
    $scope.person_list.push({price:p});
    $scope.price_list.push(p);
    $scope.total_price += parseFloat(p);
    $scope.price = "";
  }

  $scope.removePrice = function(priceObj) {
    for(var i=0, len=$scope.person_list.length; i<len; i++) {
      var item = $scope.person_list[i];
      if(item.price == priceObj.price) {
        $scope.person_list.splice(i, 1);
        $scope.total_price -= priceObj.price;
        break;
      }
    }
    for(var j=0, len=$scope.price_list.length; j<len; j++) {
      var price = $scope.price_list[j];
      if(price == priceObj.price) {
        $scope.price_list.splice(j, 1);
        break;
      }
    }
  }

  $scope.addPromotion = function(full, cheap) {
    if(isNaN(full) && isNaN(cheap) || full <=0 || cheap <=0) {
      return;
    }
    var full_price = $scope.full_price = parseFloat(full);
    var cheap_price = $scope.cheap_price = parseFloat(cheap);
    var flag = false;
    var list = $scope.promotion_list;
    for(var i=0, len=list.length; i<len; i++) {
      var item = list[i];
      if((item.full_price == full && item.cheap_price == cheap) || item.full_price == full) {
        flag = true;
        break;
      }
    }
    if(flag) {
      alert("同额优惠活动已选！");
      return;
    }
    $scope.promotion_list.push({
      full_price : full_price,
      cheap_price : cheap_price
    })
    $scope.full_price = "";
    $scope.cheap_price = "";
  }

  $scope.removePromotion = function(full, cheap) {
    var list = $scope.promotion_list;
    for(var i=0, len=list.length; i<len; i++) {
      var item = list[i];
      if(item.full_price == full && item.cheap_price == cheap) {
        var a =list.splice(i, 1);
        break;
      }
    }
  }

  $scope.addCashCoupon = function(p) {
    if(isNaN(p) || p <= 0) {
      return;
    }
    var cash_coupon = p;
    $scope.cash_coupon_list.push({
      cash_coupon : cash_coupon
    })
    $scope.total_cash_coupon += parseFloat(cash_coupon);
    $scope.cash_coupon = "";
  }

  $scope.removeCashCoupon = function(p) {
    var list = $scope.cash_coupon_list
    for(var i=0, len=list.length; i<len; i++) {
      var item = list[i];
      if(item && item.cash_coupon == p) {
        list.splice(i, 1);
        $scope.total_cash_coupon -= p;
        break;
      }
    }
  }

  $scope.getUpcaseNum = function(n) {
    if(isNaN(n) || n < 0) {
      return;
    }
    var arr = ["一","二","三","四","五","六",
      "七","八","九","十","十一","十二"];
    return arr[n];
  }

  $scope.getUseProm = function(order, item) {
    var arr = order.split(",");
    var sum = 0;
    for(var i=0; i<arr.length; i++) {
      sum += parseFloat(arr[i]);
    }
    
    var list = item.promotion_list;
    for(var j=0; j<list.length; j++) {
      if(sum >= list[j].full_price) {
        order.show = true;
        order.prom = list[j];
        order.total = (sum - list[j].cheap_price)+"";
        item.promotion_list.splice(j, 1);
        break;
      }
    }
    return "";
  }

  $scope.setItemResult = function(item) {
    var total = 0, total_cheap_price = 0;
    for(var i=0; i<item.length; i++) {
      total += item[i].sum;
      total_cheap_price += item[i].cheap;
    }
    
    item.total = total;
    item.cheaps = total_cheap_price;
  }

  $scope.setOrderHb = function(order) {
    var price = prompt("请输入1-9元的红包",6);    
    if(price == "" || isNaN(price) || price < 0 || price > 9) {
      return;
    }
    price = parseInt(price);
    $scope.total_cash_coupon -= order.hbprice;
    order.hbprice = price;
    $scope.total_cash_coupon += order.hbprice;
  }

  $scope.run = function() {
    $scope.solution = [];
    $scope.promotion_list = $scope.promotion_list.sort(function(a, b) { 
      //降序
      return a.full_price> b.full_price ? -1 : 1; 
    });
    if($scope.person_list.length == 0) {
      alert("请先选定价格！");
      return;
    }
    $scope.person_list = $scope.person_list.sort(function(a, b) {
      //降序
      return a.price > b.price ? -1 : 1; 
    });
    if($scope.promotion_list.length == 0) {
      alert("木有优惠(⊙o⊙)，一次性购买即可！");
      return;
    }
    //
    if($scope.total_price < $scope.promotion_list[$scope.promotion_list.length-1].full_price) {
      alert("无法享受到优惠，直接购买即可！");
      return;
    }
    var t1= new Date().getTime();

    base.setList($scope.price_list).compute();
    var result = base.getResult();
    $scope.solution = base.matchPromo(result, $scope.promotion_list);
    //过滤
    $scope.solution = filterPromo($scope.solution);
    //排序
    $scope.solution = $scope.solution.sort(function(a, b) {      
      return (a.length > b.length) ? -1 : 1;
    });
    //排序
    $scope.solution = $scope.solution.sort(function(a, b) {
      var n1 = 0, n2 = 0;
      for(var i=0; i<a.length; i++) {
        n1 += a[i].cheap;
      }
      for(var j=0; j<b.length; j++) {
        n2 += b[j].cheap;
      }
      return (n1 > n2) ? -1 : 1;
    });
    
    var t2 = new Date().getTime();
    //console.log("用时"+(t2-t1)/1000+"秒");
    
    //取优选方案
    if($scope.solution.length > 2) {
      $scope.solution.length = 2;
    }
  }

  function filterPromo(list) {
    var n = {}, r = []; 
    for(var i=0; i<list.length; i++) {
      var sum =0;
      var orders = list[i];
      for(var j=0; j<orders.length; j++) {
        sum += orders[j].cheap;
      }
      var key = sum+"-"+orders.length;
      if (!n[key]) {
        n[key] = true; 
        r.push(orders);
      }
    }
    return r;
  }
})