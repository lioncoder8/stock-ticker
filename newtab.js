var number = -1; 
var lst = [];

function formatNumber(number) 
{
	return parseFloat(Math.round(number*100)/100).toFixed(2);
}

function Quote(name,symbol,last,change,percent)  
{
	this.name = name;
	this.symbol = symbol;
	this.lastPrice = last;
	this.change = String(change);
	this.percent = percent;
	this.getName = function() 
	{
		if (this.formattedName)
		{
			return this.formattedName;
		}
		return this.name;
	};
	this.getSymbol = function() 
	{
		if (this.formattedSymbol)
		{
			return this.formattedSymbol;
		}
		return this.symbol;
	};
	this.getLastPrice = function() 
	{
		if (this.formattedLastPrice)
		{
			return this.formattedLastPrice;
		}
		return this.lastPrice;
	};
	this.getChange = function() 
	{
		if (this.formattedChange)
		{
			return this.formattedChange;
		}
		return this.change;
	};
	this.getPercent = function() 
	{
		if (this.formattedPercent)
		{
			return this.formattedPercent;
		}
		return this.percent;
	};
	this.formatValues = function()
	{
		if (!this.name)
		{
			this.formattedName = "N/A";
		}
		else
		{
			this.formattedName = this.name;
		}
		if (this.lastPrice)
		{
			this.formattedLastPrice = formatNumber(this.lastPrice);
		}
		else
		{
			this.formattedLastPrice = "N/A";
		}
		if (!this.change)
		{
			this.formattedChange = "+0.00";
		}
		else if (this.change.indexOf("-") === 0)
		{
			this.formattedChange = formatNumber(this.change);
		}
		else
		{
			this.formattedChange = "+" + formatNumber(this.change);
		}
		if (!this.percent)
		{
			this.formattedPercent = "(0.00%)";
		}
		else
		{
			this.formattedPercent = "(" + formatNumber(Math.abs(this.percent)) + "%)";
		}
	};
	this.colorPercent = function()
	{
		if (this.formattedChange && this.formattedPercent)
		{
			var change = this.formattedChange;
			var percent = this.formattedPercent;
		}
		else
		{
			var change = this.change;
			var percent = this.percent;
		}
		if (change >= 0)
		{
			return "<span>" + percent + "</span>";
		}
		else
		{
			return "<font>" + percent + "</font>"; 
		}
	};
}

function loadEvent(newEvent) 
{
	var oldEvent = window.onload;
	if (typeof window.onload != "function")
	{
		window.onload = newEvent;
	}
	else
	{
		oldEvent();
		newEvent();
	}
}

function updateStocks()
{
	lookUpStock("favorite");
}

function getHttpResponse(url,callback,errorCallback)
{
	var request = new XMLHttpRequest();
	if (callback)
	{
		request.onreadystatechange = function()
		{
			if (request.readyState === 4)
			{
				if (request.status === 200)
				{
					callback(request);
				}
				else
				{
					errorCallback(request.status);
				}
			}
		}
	}
	request.open("GET",url,!!callback);
	try
	{
		if (request.status === 0 || request.status === 200)
		{
			request.send();
		}
	}
	catch (err)
	{
		if (errorCallback)
		{
			errorCallback(err);
		}
		else
		{
			throw err;
		}
	}
	if (!callback)
	{
		return request.responseText;
	}
}

function lookUpStock()
{
	localStorage.marquee = "";
	var info = localStorage.favorites.split(" ");
	var quotes = [];
	var stock = info.length - 1;
	getStocks();
	function getStocks()
	{
		setTimeout(
		function() 
		{
			if (stock >= 0)
			{
				getInfoForStock(function(){stock=stock-1;getStocks(info);});
			}
		}, 
		0*1000);
	}
	function getInfoForStock(callback)
	{
		getStockInfo(quotes,info,stock,info[stock]);
		callback();
	}
}

function getStockInfo(quotes,info,stock,symbol)
{
	var baseURL = "http://dev.markitondemand.com/MODApis/Api/v2/Quote/json?symbol=";
	getHttpResponse(baseURL + encodeURIComponent(symbol),
	function(request)
	{
		if (request.readyState === 4 && request.status === 200)
		{
			var text = request.responseText;
			var stockQuote = JSON.parse(text);
			var q = new Quote(stockQuote.Name,stockQuote.Symbol,stockQuote.LastPrice,stockQuote.Change,stockQuote.ChangePercent);
			q.formatValues();
			var obj = {sym: q.getSymbol(), lp: "$" + q.getLastPrice(), cp: q.colorPercent()};
			quotes.push(obj)
			function compareSymbol(quote1,quote2)
			{
				if (quote1["sym"] > quote2["sym"])
				{
					return 1;
				}
				else if (quote1["sym"] < quote2["sym"])
				{
					return -1;
				}
				return 0;
			}
			if (quotes.length === localStorage.favorites.split(" ").length)
			{
				quotes = quotes.sort(compareSymbol);
				for (var i = 0; i < quotes.length; i++)
				{
					if (quotes[i].sym === "^DJX")
					{
						var sym = "^DJI";
					}
					else
					{
						var sym = quotes[i].sym;
					}
					var marquee = localStorage.marquee.split(" ");
					var a = "<a";
					var href = "href='http://finance.yahoo.com/q?s=" + sym + "'>" + sym + "</a>";
					if (quotes[i].sym === "^DJX")
					{
						var lp = formatNumber(quotes[i].lp * 100);
					}
					else
					{
						var lp = quotes[i].lp;
					}
					var cp = quotes[i].cp;
					if (marquee.indexOf(href) !== -1)
					{
						var index = marquee.indexOf(href);
						marquee.splice(index-1,4,a,href,lp,cp);
						localStorage.marquee = marquee.join(" ");
					}
					else
					{
						if (localStorage.marquee != "")
						{
							var ind = (localStorage.favorites.split(" ").indexOf(quotes[i].sym)) * 4;
							marquee.splice(ind,0,a,href,lp,cp).join(" ");
							localStorage.marquee = marquee.join(" ");
						}
						else
						{
							localStorage.marquee += [a,href,lp,cp].join(" ");
						}
					}
				}
			}
		}
	},
	function(err)
	{
		document.getElementById("speed").innerHTML = localStorage.marquee;
	});
}

function getSearchSuggest(term)
{
	if (term === "" || term.split(" ").join("") === "" || term.length > 100)
	{
		document.getElementById("suggest").innerHTML = "";
		number = -1;
		return;
	}
	var ids = [];
	getHttpResponse("http://suggestqueries.google.com/complete/search?output=firefox&q=" + term,
	function(response)
	{
		var text = response.responseText;
		var info = JSON.parse(text);
		var result = "";
		for (var i = 0; i < info[1].length; i++)
		{
			ids.push(info[1][i]);
			result += '<label class="ss" id="' + info[1][i] + '">' + info[1][i] + "</label>" + "<br>";
		}
		if (result !== document.getElementById("suggest").innerHTML)
		{
			number = -1;
			document.getElementById("suggest").innerHTML = "";
			for (var i = 0; i < info[1].length; i++)
			{
				var label = document.createElement("LABEL");
				label.appendChild(document.createTextNode(info[1][i]));
				label.setAttribute("id","ss "+info[1][i]);
				label.setAttribute("class","ss");
				label.onclick = function(id)
				{
					return function()
					{
						document.getElementById("input").value = id.slice(3);
						window.open("https://www.google.com/search?q=" + id.slice(3),"_self");
					}
				}(label.id);
				document.getElementById("suggest").appendChild(label);
				document.getElementById("suggest").appendChild(document.createElement("br"));
			}
		}
	},
	function(err)
	{
		console.log(err);
		document.getElementById("suggest").innerHTML = "";
		number = -1;
	});
	return ids;
}

function keySelect()
{
	var oldNumber = number;
	if (event.keyCode == 40)
	{
		if (number > -1 && number < lst.length)
		{
			document.getElementById("ss " + lst[oldNumber]).setAttribute("style","background-color:transparent");	
		}
		if (number > -2 && number < lst.length)
		{
			number += 1;
		}
		if (number === lst.length)
		{
			number = 0;
		}
		document.getElementById("ss " + lst[number]).setAttribute("style","background-color:grey");
		document.getElementById("input").value = lst[number];
	}
	else if (event.keyCode == 38)
	{
		if (number > -1 && number < lst.length)
		{
			document.getElementById("ss " + lst[oldNumber]).setAttribute("style","background-color:transparent");
			number -= 1;
		}
		if (number === -1)
		{
			number = lst.length - 1;
		}
		document.getElementById("ss " + lst[number]).setAttribute("style","background-color:grey");
		document.getElementById("input").value = lst[number];
	}
}

loadEvent(updateStocks);

document.getElementById("ticker").setAttribute("style","width:"+(1.1*screen.width)+"px;");
document.getElementById("input").setAttribute("style","align:center;width:"+(0.8*screen.width)+"px;"+"height:50px;font:40px Calibri,sans-serif;");
document.getElementById("suggest").setAttribute("style","padding:15px;width:"+(0.8*screen.width)+"px;"+"height:50px;font:20px Calibri,sans-serif;color:white;");
document.getElementById("submit").setAttribute("style","font-size:20px;width:"+(0.075*screen.width)+"px;"+"height:50px;")

setTimeout(function()
{
	var speed = String(localStorage.favorites.split(" ").length * 5);
	var string = "marquee " + speed + "s linear infinite";
	document.getElementById("speed").style.animation = string;
	document.getElementById("speed").style.WebkitAnimation = string;
	document.getElementById("speed").innerHTML = localStorage.marquee;
	document.getElementById("speed").onmouseover = function()
	{
		document.getElementById("speed").style.animationPlayState = "paused";
		document.getElementById("speed").style.WebkitAnimationPlayState = "paused";
	};
	document.getElementById("speed").onmouseout = function()
	{
		document.getElementById("speed").style.animationPlayState = "running";
		document.getElementById("speed").style.WebkitAnimationPlayState = "running";
	}
},1000);

document.getElementById("input").addEventListener("keyup",function()
{
	if (event.keyCode === 8 || event.keyCode === 32 || event.keyCode >= 48)
	{
		lst = getSearchSuggest(document.getElementById("input").value);
	}
});

document.getElementById(":").addEventListener("keydown",function(){keySelect(lst);}); 