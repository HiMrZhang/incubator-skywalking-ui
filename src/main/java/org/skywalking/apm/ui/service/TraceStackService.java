package org.skywalking.apm.ui.service;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import org.apache.http.NameValuePair;
import org.apache.http.message.BasicNameValuePair;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.skywalking.apm.ui.creator.UrlCreator;
import org.skywalking.apm.ui.tools.HttpClientTools;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * @author pengys5
 */
@Service
public class TraceStackService {

    private Logger logger = LogManager.getFormatterLogger(TraceStackService.class);

    private Gson gson = new Gson();

    @Autowired
    private UrlCreator UrlCreator;

    public String loadTraceStackData(String globalId) throws IOException {
        List<NameValuePair> params = new ArrayList<NameValuePair>();
        params.add(new BasicNameValuePair("globalTraceId", globalId));

        String globalTraceLoadUrl = UrlCreator.compound("traceStack/globalTraceId");
        String globalTraceResponse = HttpClientTools.INSTANCE.get(globalTraceLoadUrl, params);

        JsonArray traceStackArray = gson.fromJson(globalTraceResponse, JsonArray.class);

        logger.debug("load trace stack array data: %s", traceStackArray);

        return traceStackArray.toString();
    }
}