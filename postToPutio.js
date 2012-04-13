var transferCheckTime = 30000,
	transferCheck = false,
	postingNote,
	completed=[];


updateContext();

// Listen for clicking on the icon, open the options page
chrome.browserAction.onClicked.addListener(function(tab){
    chrome.tabs.create({url:"options.html"});
});

// ---------------------------------------------------------------------------------------------------------------------------------------- //

function updateContext()
{
    chrome.contextMenus.removeAll();
    chrome.contextMenus.create({"title": "Add to Put.io transfer (page)", "contexts":["page"], "onclick": function(info, tab){postPage(info,tab)} });
    chrome.contextMenus.create({"title": "Add to Put.io transfer (link)", "contexts":["link"], "onclick": function(info, tab){postLink(info,tab)} });
    chrome.contextMenus.create({"title": "Add to Put.io transfer (selection)", "contexts":["selection"], "onclick": function(info, tab){postText(info,tab)} });
}

// ---------------------------------------------------------------------------------------------------------------------------------------- //

function postText(info, tab) 
{   
    postContent(info,tab,info.selectionText);
}
function postLink(info, tab) 
{   
    postContent(info,tab,info.linkUrl);
}
function postPage(info, tab) 
{   
    postContent(info,tab,info.pageUrl);
}

// ---------------------------------------------------------------------------------------------------------------------------------------- //


function postContent(info, tab, link) 
{   
    var apiSecret	= localStorage.getItem("api_secret"),
		apiKey 		= localStorage.getItem("api_key");
    
    if(!apiSecret || apiSecret=="" || !apiKey || apiKey=="")
    {
        // Whoops!
        alert("You need to set your Put.io API info");
        
        // Go to the options page
        chrome.tabs.create({url:"options.html"});   
    }
    else
    {           
        //alert([apiSecret,apiKey,link].join(','))
        // Add some generic params
		prm = JSON.stringify({"api_secret":apiSecret,"api_key":apiKey,"params":{"links":[link]}});
		
		console.log(prm)
		
       	postingNote = webkitNotifications.createNotification('icon-48.png', "Posting Content..", link);
       	postingNote.show();
		
		
        $.ajax({
			url: 'http://api.put.io/v1/transfers?method=add&request='+prm,
			type: 'POST',
			async: false,
			complete: function(data)
			{     
				console.log('PostContent',data)
				data = JSON.parse(data.responseText);
				console.log('PostContentJSON',data)
				if(!data.error){
					console.log("Success")
					postingNote.cancel();               
					var postedNote = webkitNotifications.createNotification('icon-48.png', "Success!", data.response.results[0].name);                  
					setTimeout(function() { postedNote.cancel(); }, 5000);
					postedNote.show();
					
					transferCheck=true;
					checkTransfer();
					
				} 
				else
				{
					console.error("FAIL")
					postingNote.cancel();                
					var errorNote = webkitNotifications.createNotification('icon-48.png', "Error!", "Bad details");
					setTimeout(function() { errorNote.cancel(); }, 5000);
					errorNote.show();                   
					// Go to the options page
					chrome.tabs.create({url:"options.html"});
				}

		 	}
         });           
    }
}

function checkTransfer(force){
	
	var apiSecret	= localStorage.getItem("api_secret"),
		apiKey 		= localStorage.getItem("api_key");
    
    if(!apiSecret || apiSecret=="" || !apiKey || apiKey=="")
    {
        // Whoops!
        alert("You need to set your Put.io API info");
        
        // Go to the options page
        chrome.tabs.create({url:"options.html"});   
    }
    else {
		if(transferCheck||force){
	
			$.ajax({
				url: 'http://api.put.io/v1/transfers?method=list&request='+JSON.stringify({"api_secret":apiSecret,"api_key":apiKey,"params":{}}),
				type: 'POST',
				async: true,
				complete: function(data)
				{    
					console.log('Progress',data)
					data = JSON.parse(data.responseText)
					console.log('ProgressJSON',data)
					if(data.response.total>0){
					
						for(var i=0,file;i<data.response.total;i++){
							file=data.response.results[i];
							if(file['percent_done']>99 && !completed[file.id]) {
					        	if(file['status']=="Completed" || file['status']=="Seeding") {
						
									completed[file.id]=true;
									
									$.ajax({
										url: 'http://api.put.io/v1/files?method=search&request='+JSON.stringify(
											{"api_secret":apiSecret,"api_key":apiKey,"params":{
												"query":file.name
											}}),
										type: 'POST',
										async: true,
										complete: function(fdata)
										{    
											
											fdata=JSON.parse(fdata.responseText);
											
											if(fdata.response.total>0){
											
												var ffile = fdata.response.results[0];
//												var postedNote = webkitNotifications.createHTMLNotification("<img src=\"ffile['file_icon_url']\"><a target='_blank' href='"+ffile['download_url']+"'>"+ffile['name']+"</a>");
												var postedNote = webkitNotifications.createHTMLNotification("test.html?t=Complete&i="+escape(ffile['file_icon_url'])+"&l="+escape(ffile['download_url'])+"&=n"+escape(ffile['name']));
												postedNote.show();
											}
											
											
								
										}
									});
									
								}
					
							}
					
						}
					
						transferCheck=true;
						setTimeout(checkTransfer,transferCheckTime);
				
					} 
					else
					{
						checkTransfer=false;
					}

			 	}
	        });   
		}
	}
}


checkTransfer(true);
// ---------------------------------------------------------------------------------------------------------------------------------------- //