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
		if (this.formattedName){return this.formattedName;}
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
			this.formattedLastPrice = "$" + formatNumber(this.lastPrice);
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
		if (this.symbol == undefined)
		{
			throw new Error("Symbol does not exist.");
		}
		else
		{
			this.formattedSymbol = this.symbol;
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

function checkStorage()
{
	if (!localStorage.input)
	{
		localStorage.input = "";
	}
	if (!localStorage.favorites)
	{
		localStorage.favorites = "";
	}
	if (!localStorage.quote)
	{
		localStorage.quote = "";
	}
	if (!localStorage.marquee)
	{
		localStorage.marquee = "";
	}
	document.getElementById("input").value = localStorage.input;
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

function lookUpStock(arg)
{
	var info;
	var quotes = [];
	var table = document.createElement("TABLE");
	table.setAttribute("border","2");
	var thead = document.createElement("THEAD");
	var header = document.createElement("TR");
	var names = ["Name", "Symbol", "Price", "Change", ""];
	appendToRow(header,names,"TH");
	thead.appendChild(header);
	table.appendChild(thead);
	var tbody = document.createElement("TBODY");
	var input = document.getElementById("input").value;
	getHttpResponse("http://dev.markitondemand.com/Api/v2/Lookup/json?input=" + input,
	function(request)
	{
		if (request.readyState === 4 && request.status === 200)
		{
			if (arg === "input")
			{
				var text = request.responseText;
				info = JSON.parse(text);
				info = filterStocks(info);
			}
			else
			{
				localStorage.marquee = "";
				if (localStorage.favorites === '')
				{
					displayNoFavoritesMessage();
					return;
				}
				info = localStorage.favorites.split(" ");
			}
			stock = info.length - 1;
			getStocks();
			document.getElementById("error").innerHTML = "";
		}
	},
	function(err)
	{
		document.getElementById("quote").innerHTML = localStorage.quote;
		document.getElementById("marq").innerHTML = localStorage.marquee;
		document.getElementById("error").innerHTML = "Please try again later.";
		enableButtons();
	});
	function getStocks()
	{
		setTimeout(
		function() 
		{
			if (stock >= 0)
			{
				getInfoForStock(function(){stock=stock-1;getStocks(info);});
			}
			else
			{
				localStorage.input = input;
			}
		}, 
		0*1000);
	}
	function getInfoForStock(callback)
	{
		// disableButtons();
		if (typeof info[stock] === "string")
		{
			getStockInfo(info[stock],info,quotes,table,tbody);
		}
		else
		{
			getStockInfo(info[stock].Symbol,info,quotes,table,tbody);
		}
		callback();
	}
}

function getStockInfo(symbol,info,quotes,table,tbody)
{
	var baseURL = "http://dev.markitondemand.com/MODApis/Api/v2/Quote/json?symbol=";
	getHttpResponse(baseURL + encodeURIComponent(symbol),
	function(request)
	{
		if (request.readyState === 4 && request.status === 200)
		{
			var text = request.responseText;
			var stockQuote = JSON.parse(text);
			var q = new Quote(stockQuote.Name, stockQuote.Symbol,stockQuote.LastPrice,stockQuote.Change,stockQuote.ChangePercent);
			try
			{
				q.formatValues();
				var values = [q.getName(), q.getSymbol(), q.getLastPrice(), q.getChange()+" "+q.getPercent(), 
						      q.getSymbol()+" "+q.getLastPrice()+" "+q.colorPercent()+" +"];
				var obj = {name: q.getName(), sym: q.getSymbol(), lp: q.getLastPrice(), cp: q.getChange()+" "+q.getPercent(), 
				slp: q.getSymbol()+" "+q.getLastPrice()+" "+q.colorPercent()+" +"};
				var row = document.createElement("TR");
				appendToRow(row,values,"TD");
				tbody.appendChild(row);
				quotes.push(obj);
			}
			catch (err)
			{
				console.log(err);
				info.splice(stock,1);
			}
			if (tbody.rows.length !== 0 && tbody.rows.length === info.length)
			{
				tbody.innerHTML = "";
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
				quotes = quotes.sort(compareSymbol);
				for (var i = 0; i < quotes.length; i++)
				{
					var row = document.createElement("TR");
					appendToRow(row,quotes[i],"TD");
					tbody.appendChild(row);
					if (localStorage.favorites.split(' ').indexOf(quotes[i].sym) > -1)
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
						var lp = quotes[i].lp;
						var cp = quotes[i].slp.split(" ")[2];
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
				table.appendChild(tbody);
				checkTableLength(info);
				document.getElementById("quote").innerHTML = "";
				document.getElementById("quote").appendChild(table);
				localStorage.quote = document.getElementById("quote").innerHTML;
				var speed = String(localStorage.favorites.split(" ").length * 5);
				var string = "marquee " + speed + "s linear infinite";
				document.getElementById("marq").style.animation = string;
				document.getElementById("marq").style.WebkitAnimation = string;
				document.getElementById("marq").innerHTML = localStorage.marquee;
				document.getElementById("marq").onmouseover = function()
				{
					document.getElementById("marq").style.animationPlayState = "paused";
					document.getElementById("marq").style.WebkitAnimationPlayState = "paused";
				};
				document.getElementById("marq").onmouseout = function()
				{
					document.getElementById("marq").style.animationPlayState = "running";
					document.getElementById("marq").style.WebkitAnimationPlayState = "running";
				} 
				enableButtons();
			}
		}
	},
	function(err)
	{
		document.getElementById("quote").innerHTML = localStorage.quote;
		document.getElementById("marq").innerHTML = localStorage.marquee;
		document.getElementById("error").innerHTML = "Please try again later.";
		enableButtons();
	});
}

function filterStocks(lst)
{
	for (var i = 0; i < lst.length; i++)
	{
		if (lst[i].Name == "" || !(lst[i].Exchange === "NASDAQ" || lst[i].Exchange === "NYSE"))
		{
			lst.splice(i,1);
			i--;
		}
	}
	return lst;
}

function tableElement(name,type)
{
	var td = document.createElement(type);
	if (String(name).indexOf("+") === 0)
	{
		td.appendChild(createImage("up"));
		name = name.slice(1);
		td.setAttributeNode(createColor("green"));
	}
	if (String(name).indexOf("-") === 0)
	{
		td.appendChild(createImage("down"));
		name = name.slice(1);
		td.setAttributeNode(createColor("red"));
	}
	if (String(name).indexOf("+") > 0)
	{
		var button = createFavoriteButton();
		var plus = document.createTextNode("+");
		var star = document.createTextNode("*");
		var parts = name.split(" ");
		if (localStorage.favorites.split(" ").indexOf(parts[0]) === -1)
		{
			button.appendChild(plus);
		}
		else
		{
			button.appendChild(star);
		}
		button.addEventListener("click", 
		function()
		{
			var symbol = parts[0];
			if (parts[0] === "^DJX")
			{
				var sym = "^DJI";
			}
			else
			{
				var sym = parts[0];
			}
			var marquee = localStorage.marquee.split(" ");
			var a = "<a";
			var href = "href='http://finance.yahoo.com/q?s=" + sym + "'>" + sym + "</a>";
			var lp = parts[1];
			var cp = parts[2];
			if (button.innerHTML == "+")
			{
				button.removeChild(plus);
				button.appendChild(star);
				if (localStorage.favorites === "")
				{
					localStorage.favorites = symbol;
				}
				else
				{
					localStorage.favorites += " " + symbol;
					localStorage.favorites = localStorage.favorites.split(" ").sort().join(" ");
				}
				if (localStorage.marquee.indexOf(parts[0] + " " + parts[1] + " " + parts[2] + " ") === -1)
				{
					var ind = (localStorage.favorites.split(" ").indexOf(parts[0])) * 4;
					marquee.splice(ind,0,a,href,lp,cp).join(" ");
					localStorage.marquee = marquee.join(" ");
				} 
			}
			else
			{
				button.removeChild(star);
				button.appendChild(plus);
				var favorites = localStorage.favorites.split(" ");
				var index1 = favorites.indexOf(symbol);
				favorites.splice(index1,1);
				localStorage.favorites = favorites.join(" ");
				var marquee = localStorage.marquee.split(" ");
				var index2 = marquee.indexOf("href='http://finance.yahoo.com/q?s=" + parts[0] + "'>" + parts[0] + "</a>");
				marquee.splice(index2-1,4);
				localStorage.marquee = marquee.join(" ");
				localStorage.favorites = localStorage.favorites.split(" ").sort().join(" ");
			}
		});
		td.appendChild(button);
	}
	else
	{
		var text = document.createTextNode(name);
		td.appendChild(text);
	}
	return td;
}

function appendToRow(row,obj,type)
{
	for (var property in obj)
	{
		if (obj[property] === "^DJX")
		{
			row.appendChild(tableElement("^DJI",type));
		}
		else
		{
			row.appendChild(tableElement(obj[property],type));
		}
	}
}

function createImage(imgName)
{
	var img = new Image();
	img.src = imgName + ".png";
	return img;
}

function createColor(color)
{
	var style = document.createAttribute("style");
	style.value = "color:" + color + ";";
	return style;
}

function createFavoriteButton()
{
	var button = document.createElement("BUTTON");
	button.setAttribute("style","width:100%");
	button.setAttribute("class","fav");
	return button;
}

function displayNoFavoritesMessage()
{
	document.getElementById("quote").innerHTML = "<p>No favorites.<br><br>To add a stock " +
	"to your favorites, search for the stock and press the "
	+ '+' + " button next to it.<br><br>" + "</p>";
	document.getElementById("error").innerHTML = "";
	document.getElementById("quote").style.height = "100%";
	document.getElementById("quote").style.overflowY = "hidden";
	document.getElementById("marq").innerHTML = "";
}

function checkTableLength(lst)
{
	if (lst.length >= 5)
	{
		document.getElementById("quote").style.height = "140px";
		document.getElementById("quote").style.overflowY = "scroll";
	}
	else
	{
		document.getElementById("quote").style.height = "100%";
		document.getElementById("quote").style.overflowY = "hidden";
	}
}

function enableButtons()
{
	document.getElementById("input").disabled = false;
	document.getElementById("symbol").disabled = false;
	document.getElementById("favorites").disabled = false;
}

function disableButtons()
{
	document.getElementById("input").disabled = true;
	document.getElementById("symbol").disabled = true;
	document.getElementById("favorites").disabled = true;
}

function pressButton()
{
	if (event.keyCode == 13)
	{
		document.getElementById("symbol").click();
	}
}

loadEvent(checkStorage);
document.getElementById("symbol").addEventListener("click", function(){lookUpStock("input")});
document.getElementById("input").addEventListener("keypress", pressButton);
document.getElementById("favorites").addEventListener("click", function(){lookUpStock("favorite")});